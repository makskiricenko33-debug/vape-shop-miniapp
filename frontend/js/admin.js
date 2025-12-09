const API_ORDERS = "/orders/";

const STATUS_LABELS = {
    new: "Новый",
    paid: "Оплачен",
    shipped: "Отправлен",
    cancelled: "Отменён",
};

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString();
}

function openModal(title, html) {
    const modal = document.getElementById("order-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");

    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("order-modal");
    modal.style.display = "none";
}

function showOrderDetails(orderId) {
    fetch(`${API_ORDERS}${orderId}`)
        .then((res) => res.json())
        .then((data) => {
            const items = data.items || [];
            let bodyHtml = `
                <div><b>Клиент:</b> ${data.customer_name || "—"}</div>
                <div><b>Телефон:</b> ${data.phone || "—"}</div>
                <div><b>Город:</b> ${data.city || "—"}</div>
                <div><b>Telegram ID:</b> ${data.telegram_id || "—"}</div>
                <div><b>Статус:</b> ${
                    STATUS_LABELS[data.status] || data.status
                }</div>
                <div><b>Создан:</b> ${formatDate(data.created_at)}</div>
            `;

            if (!items.length) {
                bodyHtml += `<p style="margin-top:8px;color:#9ca3af;">Состав заказа пуст.</p>`;
            } else {
                bodyHtml += `<div class="modal__items">`;
                for (const it of items) {
                    bodyHtml += `
                        <div class="modal-item">
                            <div class="modal-item__title">
                                Товар ID ${it.product_id}
                            </div>
                            <div class="modal-item__meta">
                                Количество: ${it.quantity}
                            </div>
                        </div>
                    `;
                }
                bodyHtml += `</div>`;
            }

            openModal(`Заказ #${data.id}`, bodyHtml);
        })
        .catch((e) => {
            console.error(e);
            openModal("Ошибка", "<p>Не удалось получить состав заказа.</p>");
        });
}

function renderOrders(orders) {
    const container = document.getElementById("orders-list");
    if (!orders.length) {
        container.innerHTML =
            "<p style='color:#9ca3af;font-size:13px;'>Заказов пока нет.</p>";
        return;
    }

    container.innerHTML = "";
    for (const o of orders) {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <div class="product-card__content" style="grid-column: 1 / -1;">
                <div class="product-card__title">
                    Заказ #${o.id}
                </div>
                <div class="product-card__desc">
                    Статус: <b>${STATUS_LABELS[o.status] || o.status}</b><br/>
                    Клиент: ${o.customer_name || "—"}<br/>
                    Телефон: ${o.phone || "—"}<br/>
                    Город: ${o.city || "—"}<br/>
                    Telegram ID: ${o.telegram_id || "—"}<br/>
                    Создан: ${formatDate(o.created_at)}
                </div>
                <div class="product-card__meta" style="margin-top:8px;">
                    <div class="product-card__tags">
                        ${Object.entries(STATUS_LABELS)
                            .map(
                                ([key, label]) => `
                            <button class="btn"
                                data-order-id="${o.id}"
                                data-status="${key}"
                                style="width:auto;padding:4px 8px;font-size:11px;opacity:${
                                    key === o.status ? "1" : "0.7"
                                }">
                                ${label}
                            </button>`
                            )
                            .join("")}
                    </div>
                    <div style="text-align:right;margin-top:6px;">
                        <button class="btn btn-primary"
                            data-order-details="${o.id}"
                            style="width:auto;padding:4px 10px;font-size:11px;">
                            Подробнее
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    }

    container
        .querySelectorAll("button[data-order-id]")
        .forEach((btn) =>
            btn.addEventListener("click", () =>
                changeStatus(
                    btn.getAttribute("data-order-id"),
                    btn.getAttribute("data-status")
                )
            )
        );

    container
        .querySelectorAll("button[data-order-details]")
        .forEach((btn) =>
            btn.addEventListener("click", () =>
                showOrderDetails(btn.getAttribute("data-order-details"))
            )
        );
}

async function loadOrders() {
    const container = document.getElementById("orders-list");
    container.innerHTML = "Загружаем заказы...";
    try {
        const res = await fetch(API_ORDERS);
        const data = await res.json();
        renderOrders(data);
    } catch (e) {
        console.error(e);
        container.innerHTML =
            "<p style='color:#f97373;font-size:13px;'>Ошибка загрузки заказов.</p>";
    }
}

async function changeStatus(orderId, statusValue) {
    try {
        const url = `${API_ORDERS}${orderId}/status?status_value=${encodeURIComponent(
            statusValue
        )}`;
        const res = await fetch(url, { method: "PATCH" });
        if (!res.ok) throw new Error("Не удалось обновить статус");
        await loadOrders();
    } catch (e) {
        console.error(e);
        openModal("Ошибка", "<p>Ошибка обновления статуса заказа.</p>");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("reload-orders")
        .addEventListener("click", loadOrders);

    document
        .getElementById("modal-close")
        .addEventListener("click", closeModal);
    document
        .getElementById("order-modal")
        .querySelector(".modal__backdrop")
        .addEventListener("click", closeModal);

    loadOrders();
});
