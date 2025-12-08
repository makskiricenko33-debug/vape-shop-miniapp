import logging
from telegram import Update
from telegram.ext import Updater, CommandHandler, CallbackContext

TOKEN = "8546305287:AAGFABMvv4h42UNUhY1pnCbi_qAhY9uoHSM"

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def start(update: Update, context: CallbackContext) -> None:
    update.message.reply_text("Тестовый бот 13.15: /start получен")


def main() -> None:
    updater = Updater(TOKEN, use_context=True)

    dp = updater.dispatcher
    dp.add_handler(CommandHandler("start", start))

    logger.info("Test bot started (13.15)")
    updater.start_polling()
    updater.idle()


if __name__ == "__main__":
    main()
