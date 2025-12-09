const API_PRODUCTS = "/products/";
const API_ORDERS = "/orders/";

const cart = {}; // { productId: { product, quantity } }
let tgUser = null;

/* ----- Telegram Mini App ----- */

function initTelegram() {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.expand();

    try {
        const initDataUnsafe = tg.initDataUnsafe;
        if (initDataUnsafe && initDataUnsafe.user) {
            tgUser = initDataUnsafe.user;

            const titleP = document.querySelector(".app__title p");
            if (titleP) {
                const name = tgUser.username || tgUser.first_name;
                titleP.textContent = `Каталог для @${name}`;
            }
        }
    } catch (e) {
        console.error("Telegram init error", e);
    }
}

function formatPrice(cents) {
    return `${(cents / 100).toFixed(0)} ₽`;
}

/* ----- Модалка корзины ----- */

function openCartModal(html) {
    const modal = document.getElementById("cart-modal");
    const body = document.getElementById("cart-modal-body");
    body.innerHTML = html;
    modal.style.display = "flex";
}

function closeCartModal() {
    const modal = document.getElementById("cart-modal");
    modal.style.display = "none";
}

function buildCartHtml() {
    const items = Object.values(cart);
    if (!items.length) {
        return '<p style="color:#9ca3af;font-size:13px;">Корзина пуста.</p>';
    }

    let totalQty = 0;
    let totalPrice = 0;
    let html = '<div class="modal__items">';

    for (const item of items) {
        const p = item.product;
        totalQty += item.quantity;
        totalPrice += p.price * item.quantity;

        html += `
            <div class="modal-item">
                <div class="modal-item__title">
                    ${p.name}
                </div>
                <div class="modal-item__meta">
                    Количество: ${item.quantity}${
                        p.volume_ml ? ` · ${p.volume_ml} мл` : ""
                    }
                </div>
            </div>
        `;
    }

    html += `</div>
        <div style="margin-top:10px;font-size:13px;">
            Итого: <b>${totalQty} шт</b> на сумму <b>${formatPrice(
                totalPrice
            )}</b>
        </div>
        <div style="margin-top:10px;">
            <button class="btn btn-primary" id="cart-modal-checkout-btn">
                Перейти к оформлению
            </button>
        </div>
    `;

    return html;
}

/* ----- Модалка оформления (контакты + согласие) ----- */

function openCheckoutModal(onConfirm) {
    const modal = document.getElementById("checkout-modal");
    const nameInput = document.getElementById("checkout-name");
    const phoneInput = document.getElementById("checkout-phone");
    const cityInput = document.getElementById("checkout-city");
    const consentInput = document.getElementById("checkout-consent");
    const btnCancel = document.getElementById("checkout-cancel");
    const btnConfirm = document.getElementById("checkout-confirm");

    const defaultName =
        (tgUser && (tgUser.username || tgUser.first_name)) || "";

    if (nameInput) {
        nameInput.value = defaultName;
    }
    if (phoneInput) {
        phoneInput.value = "";
    }
    if (cityInput) {
        cityInput.value = "";
    }
    if (consentInput) {
        consentInput.checked = false;
    }

    if (!modal || !btnCancel || !btnConfirm || !nameInput || !phoneInput) {
        console.error("Checkout modal elements not found");
        return;
    }

    modal.style.display = "flex";

    const close = () => {
        modal.style.display = "none";
        btnCancel.onclick = null;
        btnConfirm.onclick = null;
    };

    btnCancel.onclick = close;

    btnConfirm.onclick = () => {
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const city = cityInput.value.trim();
        const consent = consentInput ? consentInput.checked : false;

        const byPhoneRe = /^\+375\d{9}$/;
        if (!byPhoneRe.test(phone)) {
            alert("Введите телефон в формате +375XXXXXXXXX");
            return;
        }
        if (!consent) {
            alert("Нужно согласиться на обработку персональных данных.");
            return;
        }

        close();
        onConfirm({ name, phone, city });
    };
}

/* ----- Корзина / футер / бейдж ----- */

function renderCartSummary() {
    const footerBtn = document.querySelector(".app__footer .btn-primary");
    const items = Object.values(cart);
    const badge = document.getElementById("cart-count");

    const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);

    if (badge) {
        badge.textContent = totalQty;
    }

    if (items.length === 0) {
        footerBtn.textContent = "Оформить заказ (скоро)";
        footerBtn.disabled = true;
        footerBtn.style.opacity = "0.7";
    } else {
        let totalPrice = 0;
        for (const item of items) {
            totalPrice += item.product.price * item.quantity;
        }

        footerBtn.textContent = `Оформить заказ · ${totalQty} шт · ${formatPrice(
            totalPrice
        )}`;
        footerBtn.disabled = false;
        footerBtn.style.opacity = "1";
    }

    const cartModal = document.getElementById("cart-modal");
    if (cartModal && cartModal.style.display === "flex") {
        document.getElementById("cart-modal-body").innerHTML = buildCartHtml();
        const checkoutBtn = document.getElementById("cart-modal-checkout-btn");
        if (checkoutBtn) {
            checkoutBtn.addEventListener("click", () => {
                closeCartModal();
                const itemsNow = Object.values(cart);
                if (!itemsNow.length) return;
                openCheckoutModal((contact) => {
                    sendOrder(contact);
                });
            });
        }
    }
}

function setQuantity(product, qty) {
    const id = product.id;
    if (qty <= 0) {
        delete cart[id];
        qty = 0;
    } else {
        cart[id] = { product, quantity: qty };
    }

    const valueEl = document.querySelector(
        `.qty-control[data-product-id="${id}"] .qty-value`
    );
    if (valueEl) {
        valueEl.textContent = qty;
    }

    renderCartSummary();
}

/* Кнопка «В корзину» – только открывает корзину/оформление */

function addToCart(product) {
    const items = Object.values(cart);
    if (!items.length) {
        setQuantity(product, 1);
    }
    const html = buildCartHtml();
    openCartModal(html);

    const checkoutBtn = document.getElementById("cart-modal-checkout-btn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            closeCartModal();
            const itemsNow = Object.values(cart);
            if (!itemsNow.length) return;
            openCheckoutModal((contact) => {
                sendOrder(contact);
            });
        });
    }
}

/* ----- Оформление заказа ----- */

async function sendOrder(contact) {
    const items = Object.values(cart);
    if (items.length === 0) return;

    const customerName =
        contact.name ||
        (tgUser && (tgUser.username || tgUser.first_name)) ||
        "Гость";

    const payload = {
        customer_name: customerName,
        phone: contact.phone,
        city: contact.city || null,
        telegram_id: tgUser ? tgUser.id : null,
        items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
        })),
    };

    const footerBtn = document.querySelector(".app__footer .btn-primary");
    footerBtn.textContent = "Отправляем заказ...";
    footerBtn.disabled = true;

    try {
        const res = await fetch(API_ORDERS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error("Ошибка при создании заказа");
        }

        const data = await res.json();
        Object.keys(cart).forEach((k) => delete cart[k]);
        renderCartSummary();

        alert(
            `Заказ №${data.id} принят. Менеджер свяжется с вами в Telegram или по телефону.`
        );
    } catch (e) {
        console.error(e);
        alert("Не удалось оформить заказ.");
        renderCartSummary();
    } finally {
        footerBtn.disabled = false;
    }
}

/* ----- Загрузка товаров ----- */

async function loadProducts() {
    const container = document.getElementById("products-list");
    container.innerHTML = "Загружаем товары...";

    try {
        const res = await fetch(API_PRODUCTS);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML =
                "<p style='color:#9ca3af;font-size:13px;'>Пока нет товаров.</p>";
            return;
        }

        container.innerHTML = "";
        for (const item of data) {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
                <div class="product-card__thumb">
                    <div class="product-card__thumb-badge">
                        ${item.strength ? `${item.strength} мг` : "без никотина"}
                    </div>
                </div>
                <div class="product-card__content">
                    <div>
                        <div class="product-card__title">${item.name}</div>
                        <div class="product-card__desc">
                            ${item.description ?? ""}
                        </div>
                    </div>
                    <div class="product-card__meta">
                        <div class="product-card__tags">
                            ${
                                item.volume_ml
                                    ? `<span class="product-tag product-tag--ml">${item.volume_ml} мл</span>`
                                    : ""
                            }
                            ${
                                item.strength
                                    ? `<span class="product-tag product-tag--nic">${item.strength} мг</span>`
                                    : ""
                            }
                        </div>
                        <div class="product-card__price">
                            <div class="product-card__price-main">
                                ${formatPrice(item.price)}
                            </div>
                            <div class="product-card__price-sub">
                                ≈ ${(
                                    (item.price / 100) /
                                    (item.volume_ml || 30)
                                ).toFixed(1)} ₽ / мл
                            </div>
                        </div>
                    </div>
                    <div style="margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
                        <div class="qty-control" data-product-id="${item.id}">
                            <button class="qty-btn qty-minus">−</button>
                            <span class="qty-value">0</span>
                            <button class="qty-btn qty-plus">+</button>
                        </div>
                        <button class="btn btn-primary"
                            data-add-product-id="${item.id}"
                            style="width:auto;padding:6px 12px;font-size:12px;">
                            В корзину
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);

            const addBtn = card.querySelector("button[data-add-product-id]");
            addBtn.addEventListener("click", () => addToCart(item));

            const qtyControl = card.querySelector(".qty-control");
            const btnPlus = qtyControl.querySelector(".qty-plus");
            const btnMinus = qtyControl.querySelector(".qty-minus");
            const qtyValue = qtyControl.querySelector(".qty-value");

            if (cart[item.id]) {
                qtyValue.textContent = cart[item.id].quantity;
            }

            btnPlus.addEventListener("click", () => {
                const current = cart[item.id]?.quantity || 0;
                setQuantity(item, current + 1);
            });

            btnMinus.addEventListener("click", () => {
                const current = cart[item.id]?.quantity || 0;
                setQuantity(item, current - 1);
            });
        }

        renderCartSummary();
    } catch (e) {
        console.error(e);
        container.innerHTML =
            "<p style='color:#f97373;font-size:13px;'>Ошибка загрузки товаров.</p>";
    }
}

/* ----- Инициализация ----- */

document.addEventListener("DOMContentLoaded", () => {
    initTelegram();
    loadProducts();

    const footerBtn = document.querySelector(".app__footer .btn-primary");
    footerBtn.addEventListener("click", () => {
        const items = Object.values(cart);
        if (!items.length) return;
        openCheckoutModal((contact) => {
            sendOrder(contact);
        });
    });

    const cartButton = document.querySelector(".cart-indicator");
    if (cartButton) {
        cartButton.addEventListener("click", () => {
            const html = buildCartHtml();
            openCartModal(html);

            const checkoutBtn =
                document.getElementById("cart-modal-checkout-btn");
            if (checkoutBtn) {
                checkoutBtn.addEventListener("click", () => {
                    closeCartModal();
                    const itemsNow = Object.values(cart);
                    if (!itemsNow.length) return;
                    openCheckoutModal((contact) => {
                        sendOrder(contact);
                    });
                });
            }
        });
    }

    const cartModalClose = document.getElementById("cart-modal-close");
    const cartModal = document.getElementById("cart-modal");
    if (cartModalClose) {
        cartModalClose.addEventListener("click", closeCartModal);
    }
    if (cartModal) {
        const backdrop = cartModal.querySelector(".modal__backdrop");
        if (backdrop) {
            backdrop.addEventListener("click", closeCartModal);
        }
    }

    renderCartSummary();
});
