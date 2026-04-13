import { useEffect, useState } from "react";
import style from "./CartPage.module.css";
import { useNavigate } from "react-router-dom";
import CartPageAction from "./nodes/CartPageAction/CartPageAction";
import CartPageItem from "./nodes/CartPageItem/CartPageItem";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createOrder } from "../../libs/backendApi";

export default function CartPage() {
  const [data, setData] = useState({ cart: [] });
  const [totalPrice, setTotalPrice] = useState(0);
  const [promo, setPromo] = useState("");
  const [promoCount, setPromoCount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("Current user"));
    setData(currentUser);
  }, []);

  useEffect(() => {
    const basePrice = data.cart.reduce(
      (total, item) => total + item.price * item.count,
      0
    );

    const finalPrice = promoCount ? basePrice - basePrice * 0.1 : basePrice;
    setTotalPrice(finalPrice);
  }, [data, promoCount]);

  useEffect(() => {
    if (totalPrice === 0) {
      setPromo("");
    }
  }, [totalPrice]);

  const addPromo = () => {
    setPromoCount(true);
  };

  const clearLocalCart = () => {
    const currentUser = JSON.parse(localStorage.getItem("Current user"));
    const users = JSON.parse(localStorage.getItem("Users")) || [];

    setTotalPrice(0);
    setPromo("");
    setPromoCount(false);
    currentUser.cart = [];
    const userInList = users.find((user) => currentUser.username === user.username);
    if (userInList) {
      userInList.cart = [];
    }
    localStorage.setItem("Current user", JSON.stringify(currentUser));
    localStorage.setItem("Users", JSON.stringify(users));
    setData(currentUser);
  };

  const confirmOrder = async () => {
    const currentUser = JSON.parse(localStorage.getItem("Current user"));

    if (!currentUser?.cart?.length) {
      notify("Cart is empty.", "info");
      return;
    }

    const orderPayload = {
      customerName: currentUser.username || "Guest User",
      customerEmail:
        currentUser.email ||
        `${currentUser.username || "guest"}@pizza.local`,
      promoCode: promoCount ? promo : "",
      items: currentUser.cart.map((item) => ({
        pizzaId: item.id,
        quantity: item.count,
      })),
    };

    try {
      setIsSubmitting(true);
      const response = await createOrder(orderPayload);
      clearLocalCart();
      notify(`Order #${response.order.id} confirmed!`, "succ");
    } catch (error) {
      notify(error.message || "Order failed. Try again.", "err");
    } finally {
      setIsSubmitting(false);
    }
  };

  const notify = (text, type) => {
    if (type === "info") {
      toast.info(text);
    } else if (type === "err") {
      toast.error(text);
    } else {
      toast.success(text);
    }
  };

  return (
    <div className={style.cart_container}>
      <div className={style.cart_welcome}>
        <p>Cart</p>
        <div></div>
      </div>
      <div className={style.cart_content}>
        <div className={style.cart_content_cart}>
          {data.cart.map((pizza) => {
            return (
              <CartPageItem
                key={pizza.id}
                price={pizza.price}
                name={pizza.name}
                img={pizza.img}
                count={pizza.count}
                id={pizza.id}
                setData={setData}
                notify={notify}
              />
            );
          })}
          <p
            style={{ display: data.cart.length > 0 ? "none" : "block" }}
            className={style.cart_content_cart_alert}
          >
            Empty cart!
          </p>
        </div>
        <CartPageAction
          isSubmitting={isSubmitting}
          totalPrice={totalPrice}
          confirmOrder={confirmOrder}
          promo={promo}
          promoCount={promoCount}
          setPromo={setPromo}
          addPromo={addPromo}
          notify={notify}
        />
      </div>
      <img
        src="./img/allpizzabutton.svg"
        alt="button"
        width="50px"
        height="50px"
        onClick={() => navigate("/shopping")}
        className={style.cart_container_button}
      />
    </div>
  );
}
