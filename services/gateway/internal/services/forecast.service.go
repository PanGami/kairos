package services

import (
	"context"
	"encoding/json"
	"fmt"

	forecastv1 "github.com/kairos/gateway/gen/kairos/forecast/v1"
	"github.com/kairos/gateway/internal/cache"
)

type ForecastService struct {
	ml    forecastv1.ForecastServiceClient
	cache *cache.Client
}

func NewForecastService(ml forecastv1.ForecastServiceClient, c *cache.Client) *ForecastService {
	return &ForecastService{ml: ml, cache: c}
}

func MapStatus(st forecastv1.RunStatus) string {
	switch st {
	case forecastv1.RunStatus_RUN_STATUS_OK:
		return "ok"
	case forecastv1.RunStatus_RUN_STATUS_FAILED:
		return "failed"
	default:
		return "degraded"
	}
}

func (s *ForecastService) GetForecastJSON(ctx context.Context, id string, horizon int) ([]byte, error) {
	cacheKey := fmt.Sprintf("forecast:%s:%d", id, horizon)
	if cached, ok := s.cache.Get(cacheKey); ok {
		return []byte(cached), nil
	}

	resp, err := s.ml.GetForecast(ctx, &forecastv1.GetForecastRequest{
		InstrumentId: id,
		HorizonDays:  int32(horizon),
	})
	if err != nil {
		return nil, err
	}

	path := make([]map[string]any, 0, len(resp.GetPath()))
	for _, p := range resp.GetPath() {
		path = append(path, map[string]any{
			"step":    p.GetStep(),
			"median":  p.GetMedian(),
			"lower80": p.GetLower80(),
			"upper80": p.GetUpper80(),
			"lower95": p.GetLower95(),
			"upper95": p.GetUpper95(),
		})
	}

	out := map[string]any{
		"instrument_id":    resp.GetInstrumentId(),
		"horizon_days":     resp.GetHorizonDays(),
		"as_of_date":       resp.GetAsOfDate(),
		"status":           MapStatus(resp.GetStatus()),
		"reliability_tier": MapTier(resp.GetReliabilityTier()),
		"last_price":       resp.GetLastPrice(),
		"median":           resp.GetMedian(),
		"lower80":          resp.GetLower80(),
		"upper80":          resp.GetUpper80(),
		"lower95":          resp.GetLower95(),
		"upper95":          resp.GetUpper95(),
		"volatility": map[string]any{
			"daily":      resp.GetVolatility().GetDaily(),
			"annualized": resp.GetVolatility().GetAnnualized(),
			"lower":      resp.GetVolatility().GetLower(),
			"upper":      resp.GetVolatility().GetUpper(),
		},
		"correction": map[string]any{
			"theta":             resp.GetCorrection().GetTheta(),
			"probability":       resp.GetCorrection().GetProbability(),
			"rolling_base_rate": resp.GetCorrection().GetRollingBaseRate(),
		},
		"path":                   path,
		"last_successful_update": resp.GetLastSuccessfulUpdate(),
	}

	body, _ := json.Marshal(out)
	s.cache.Set(cacheKey, string(body), 300)
	return body, nil
}

func (s *ForecastService) GetHistoryJSON(ctx context.Context, id string) ([]byte, error) {
	cacheKey := fmt.Sprintf("history:%s", id)
	if cached, ok := s.cache.Get(cacheKey); ok {
		return []byte(cached), nil
	}

	resp, err := s.ml.GetHistory(ctx, &forecastv1.GetHistoryRequest{InstrumentId: id})
	if err != nil {
		return nil, err
	}

	actual := make([]map[string]any, 0, len(resp.GetActual()))
	for _, a := range resp.GetActual() {
		actual = append(actual, map[string]any{
			"date":  a.GetDate(),
			"close": a.GetClose(),
		})
	}
	backtest := make([]map[string]any, 0, len(resp.GetBacktest()))
	for _, b := range resp.GetBacktest() {
		backtest = append(backtest, map[string]any{
			"as_of_date":   b.GetAsOfDate(),
			"horizon_days": b.GetHorizonDays(),
			"median":       b.GetMedian(),
			"lower80":      b.GetLower80(),
			"upper80":      b.GetUpper80(),
		})
	}

	out := map[string]any{
		"instrument_id": resp.GetInstrumentId(),
		"actual":        actual,
		"backtest":      backtest,
	}
	body, _ := json.Marshal(out)
	s.cache.Set(cacheKey, string(body), 300)
	return body, nil
}

func (s *ForecastService) RefreshAllActive(ctx context.Context) ([]map[string]any, error) {
	listResp, err := s.ml.ListInstruments(ctx, &forecastv1.ListInstrumentsRequest{OnlyActive: true})
	if err != nil {
		return nil, err
	}

	results := make([]map[string]any, 0, len(listResp.GetInstruments()))
	for _, inst := range listResp.GetInstruments() {
		compResp, err := s.ml.ComputeForecast(ctx, &forecastv1.ComputeForecastRequest{
			InstrumentId: inst.GetInstrumentId(),
			Backfill:     false,
		})
		if err != nil {
			results = append(results, map[string]any{
				"instrument_id": inst.GetInstrumentId(),
				"status":        "failed",
				"error":         err.Error(),
			})
			continue
		}
		results = append(results, map[string]any{
			"instrument_id":    compResp.GetInstrumentId(),
			"status":           MapStatus(compResp.GetStatus()),
			"horizons_written": compResp.GetHorizonsWritten(),
			"message":          compResp.GetMessage(),
		})
	}
	s.cache.Flush()
	return results, nil
}
