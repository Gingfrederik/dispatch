package config

import (
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/khlieng/dispatch/storage"
	"github.com/spf13/viper"
)

type Config struct {
	Address            string
	Port               string
	Dev                bool
	HexIP              bool
	VerifyCertificates bool `mapstructure:"verify_certificates"`
	Headers            map[string]string
	Defaults           *Defaults
	HTTPS              *HTTPS
	LetsEncrypt        *LetsEncrypt
}

type Defaults struct {
	Name        string
	Host        string
	Port        int
	Channels    []string
	Password    string
	SSL         bool
	ReadOnly    bool
	ShowDetails bool `mapstructure:"show_details"`
}

type HTTPS struct {
	Enabled bool
	Port    string
	Cert    string
	Key     string
	HSTS    *HSTS
}

type HSTS struct {
	Enabled           bool
	MaxAge            string `mapstructure:"max_age"`
	IncludeSubdomains bool   `mapstructure:"include_subdomains"`
	Preload           bool
}

type LetsEncrypt struct {
	Domain string
	Email  string
}

func LoadConfig() (*Config, chan *Config) {
	viper.SetConfigName("config")
	viper.AddConfigPath(storage.Path.Root())
	viper.ReadInConfig()

	config := &Config{}
	viper.Unmarshal(config)

	viper.WatchConfig()

	configCh := make(chan *Config, 1)

	prev := time.Now()
	viper.OnConfigChange(func(e fsnotify.Event) {
		now := time.Now()
		// fsnotify sometimes fires twice
		if now.Sub(prev) > time.Second {
			config := &Config{}
			err := viper.Unmarshal(config)
			if err == nil {
				configCh <- config
			}

			prev = now
		}
	})

	return config, configCh
}
