//telegramController.js
export const redirectToTelegram = (req, res) => {
  try {
    // Redirects to the invite link defined in .env, or falls back to standard Telegram home
    const telegramUrl = process.env.TELEGRAM_GROUP_URL || 'https://t.me';
    res.redirect(telegramUrl);
  } catch (error) {
    console.error('Telegram redirection error:', error);
    res.status(500).json({ message: 'Server error during redirection' });
  }
};