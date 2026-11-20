// Package cache provides a minimal stdlib RESP2 Redis client for ephemeral response caching (ADR-007).
package cache

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"strconv"
	"strings"
	"time"
)

type Client struct {
	addr string
}

func New(addr string) *Client {
	return &Client{addr: addr}
}

func (c *Client) do(args ...string) (string, error) {
	conn, err := net.DialTimeout("tcp", c.addr, 500*time.Millisecond)
	if err != nil {
		return "", err
	}
	defer conn.Close()
	_ = conn.SetDeadline(time.Now().Add(1 * time.Second))

	var sb strings.Builder
	fmt.Fprintf(&sb, "*%d\r\n", len(args))
	for _, a := range args {
		fmt.Fprintf(&sb, "$%d\r\n%s\r\n", len(a), a)
	}
	if _, err := conn.Write([]byte(sb.String())); err != nil {
		return "", err
	}

	r := bufio.NewReader(conn)
	line, err := r.ReadString('\n')
	if err != nil {
		return "", err
	}
	line = strings.TrimSuffix(strings.TrimSuffix(line, "\n"), "\r")
	if len(line) == 0 {
		return "", fmt.Errorf("empty redis reply")
	}
	switch line[0] {
	case '+':
		return line[1:], nil
	case '-':
		return "", fmt.Errorf("redis error: %s", line[1:])
	case '$':
		n, err := strconv.Atoi(line[1:])
		if err != nil || n < 0 {
			return "", nil
		}
		buf := make([]byte, n+2)
		if _, err := io.ReadFull(r, buf); err != nil {
			return "", err
		}
		return string(buf[:n]), nil
	default:
		return line[1:], nil
	}
}

func (c *Client) Ping() error {
	_, err := c.do("PING")
	return err
}

func (c *Client) Get(key string) (string, bool) {
	val, err := c.do("GET", key)
	if err != nil || val == "" {
		return "", false
	}
	return val, true
}

func (c *Client) Set(key, val string, ttlSec int) {
	_, _ = c.do("SETEX", key, strconv.Itoa(ttlSec), val)
}

func (c *Client) Flush() {
	_, _ = c.do("FLUSHDB")
}
