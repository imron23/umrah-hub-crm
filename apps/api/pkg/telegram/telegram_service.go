package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type TelegramService interface {
	SendMessage(message string) error
	SendSecurityAlert(email, role, action, path, ip string) error
	SendHotLeadAlert(name, phone, budget, score string) error
}

type telegramService struct {
	botToken string
	chatID   string
}

func NewTelegramService() TelegramService {
	return &telegramService{
		botToken: os.Getenv("TELEGRAM_BOT_TOKEN"),
		chatID:   os.Getenv("TELEGRAM_CHAT_ID"),
	}
}

func (s *telegramService) SendMessage(message string) error {
	if s.botToken == "" || s.chatID == "" {
		fmt.Printf("[MOCK-TELEGRAM] %s\n", message)
		return nil
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.botToken)
	payload := map[string]interface{}{
		"chat_id":    s.chatID,
		"text":       message,
		"parse_mode": "Markdown",
	}

	jsonPayload, _ := json.Marshal(payload)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram returned status: %d", resp.StatusCode)
	}

	return nil
}

func (s *telegramService) SendSecurityAlert(email, role, action, path, ip string) error {
	msg := fmt.Sprintf(
		"🚨 *SECURITY ALERT - UMRAH HUB*\n\n" +
		"⚠️ *Action:* %s\n" +
		"👤 *User:* %s\n" +
		"🛡️ *Role:* %s\n" +
		"📍 *Path:* `%s`\n" +
		"🌐 *IP:* %s\n\n" +
		"Please check the system immediately.",
		action, email, role, path, ip,
	)
	return s.SendMessage(msg)
}

func (s *telegramService) SendHotLeadAlert(name, phone, budget, score string) error {
	msg := fmt.Sprintf(
		"🔥 *SUPER HOT LEAD DETECTED*\n\n" +
		"👤 *Name:* %s\n" +
		"📞 *Phone:* `%s`\n" +
		"💰 *Budget:* %s\n" +
		"🎯 *Score:* %s%%\n\n" +
		"⚡ _Immediate follow-up recommended!_",
		name, phone, budget, score,
	)
	return s.SendMessage(msg)
}
