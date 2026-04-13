import style from "./CartPageAction.module.css";

export default function CartPageAction({
  notify,
  totalPrice,
  confirmOrder,
  isSubmitting,
  promoCount,
  promo,
  setPromo,
  addPromo,
}) {
  return (
    <div className={style.cart_content_action}>
      <div className={style.cart_content_action_payment}>
        <p className={style.action_title}>Your Subtotal</p>
        <p className={style.action_subtitle}>Subtotal ~ ${totalPrice}</p>
        <button
          onClick={confirmOrder}
          className={style.action_button}
          disabled={totalPrice === 0 || isSubmitting}
        >
          {isSubmitting ? "Placing..." : "Confirm Order"}
        </button>
      </div>
      <div className={style.cart_content_action_promo}>
        <p className={style.action_title}>Promo Code</p>
        <input
          type="text"
          className={style.action_input}
          placeholder="Enter promo code..."
          readOnly={totalPrice === 0 || promoCount}
          value={promo}
          onChange={(el) => setPromo(el.target.value)}
        />
        <button
          className={style.action_button}
          disabled={!promo || promoCount}
          onClick={() => {
            addPromo();
            notify("Discount 10% was actived", "info");
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
