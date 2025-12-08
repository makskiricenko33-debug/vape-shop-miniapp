import sys
from pathlib import Path
import logging

from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, WebAppInfo
from telegram.ext import Updater, CommandHandler, CallbackContext

# добавить корень проекта в sys.path
ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.append(str(ROOT_DIR))

from backend.config import get_settings  # noqa: E402

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

settings = get_settings()


def start(update: Update, context: CallbackContext) -> None:
    # Тест: проверяем, что именно этот хэндлер вызывается
    webapp_url = "http://localhost:8000/app"

    keyboard = [
        [
            KeyboardButton(
                text="🛍 Открыть магазин",
                web_app=WebAppInfo(url=webapp_url),
            )
        ]
    ]

    reply_markup = ReplyKeyboardMarkup(
        keyboard,
        resize_keyboard=True,
        one_time_keyboard=False,
    )

    update.message.reply_text(
        "Vape Shop бот: /start получен\nНажми кнопку ниже, чтобы открыть магазин.",
        reply_markup=reply_markup,
    )


def main() -> None:
    print(">>> Vape Shop bot starting")  # чтобы видеть, что именно этот файл запустился

    updater = Updater(settings.TELEGRAM_BOT_TOKEN, use_context=True)

    dp = updater.dispatcher
    dp.add_handler(CommandHandler("start", start))

    logger.info("Vape Shop bot started (polling)")
    updater.start_polling()
    updater.idle()


if __name__ == "__main__":
    main()
