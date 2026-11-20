// Package services contains domain-scoped inter-service communication with ml-service and Redis cache.
package services

import (
	"context"
	"encoding/json"
	"fmt"

	forecastv1 "github.com/kairos/gateway/gen/kairos/forecast/v1"
	"github.com/kairos/gateway/internal/cache"
)

type InstrumentService struct {
	ml    forecastv1.ForecastServiceClient
	cache *cache.Client
}

func NewInstrumentService(ml forecastv1.ForecastServiceClient, c *cache.Client) *InstrumentService {
	return &InstrumentService{ml: ml, cache: c}
}

func (s *InstrumentService) CheckReady(ctx context.Context) error {
	if _, err := s.ml.ListInstruments(ctx, &forecastv1.ListInstrumentsRequest{OnlyActive: true}); err != nil {
		return fmt.Errorf("ml-service: %w", err)
	}
	if err := s.cache.Ping(); err != nil {
		return fmt.Errorf("redis: %w", err)
	}
	return nil
}

func (s *InstrumentService) ListInstrumentsJSON(ctx context.Context, onlyActive bool) ([]byte, error) {
	cacheKey := fmt.Sprintf("instruments:%v", onlyActive)
	if cached, ok := s.cache.Get(cacheKey); ok {
		return []byte(cached), nil
	}

	resp, err := s.ml.ListInstruments(ctx, &forecastv1.ListInstrumentsRequest{OnlyActive: onlyActive})
	if err != nil {
		return nil, err
	}

	items := make([]map[string]any, 0, len(resp.GetInstruments()))
	for _, inst := range resp.GetInstruments() {
		items = append(items, map[string]any{
			"instrument_id":    inst.GetInstrumentId(),
			"symbol":           inst.GetSymbol(),
			"mic":              inst.GetMic(),
			"currency":         inst.GetCurrency(),
			"timezone":         inst.GetTimezone(),
			"status":           inst.GetStatus(),
			"reliability_tier": MapTier(inst.GetReliabilityTier()),
		})
	}
	body, _ := json.Marshal(map[string]any{"instruments": items})
	s.cache.Set(cacheKey, string(body), 300)
	return body, nil
}

func MapTier(rt forecastv1.ReliabilityTier) string {
	switch rt {
	case forecastv1.ReliabilityTier_RELIABILITY_TIER_FULL:
		return "full"
	case forecastv1.ReliabilityTier_RELIABILITY_TIER_INSUFFICIENT:
		return "insufficient"
	default:
		return "low"
	}
}
