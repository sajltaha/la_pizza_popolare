import style from "./Menu.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addPizzaToCart } from "../../../../libs/Menu_functions";
import MenuModal from "./nodes/MenuModal/MenuModal";
import MenuContentAll from "./nodes/MenuContentAll/MenuContentAll";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchPizzas } from "../../../../libs/backendApi";

export default function Menu() {
  const [dataBig, setDataBig] = useState([]);
  const [dataMid, setDataMid] = useState([]);
  const [dataSmall, setDataSmall] = useState([]);
  const [apiError, setApiError] = useState("");
  const [pizza, setPizza] = useState("");
  const [input, setInput] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const loadPizzas = async () => {
      try {
        const pizzas = await fetchPizzas();
        if (ignore) {
          return;
        }

        setDataBig(pizzas.slice(0, 8));
        setDataMid(pizzas.slice(0, 4));
        setDataSmall(pizzas.slice(0, 3));
        setApiError("");
      } catch (error) {
        if (ignore) {
          return;
        }

        setApiError("Menu data is currently unavailable.");
        toast.error("Failed to load pizza menu from backend API.");
      }
    };

    loadPizzas();

    return () => {
      ignore = true;
    };
  }, []);

  const req_addPizzaToCart = () => {
    addPizzaToCart(
      pizza.id,
      input,
      pizza.name,
      pizza.price,
      pizza.img,
      setPizza,
      setInput
    );
  };

  const showPizzaData = (id, data) => {
    const findPizza = data.find((pizza) => pizza.id === id);
    setPizza(findPizza);
  };

  const notify = () => toast.success("Succesfully added to cart!");

  return (
    <div className={style.menu_container}>
      <div className={style.menu_welcome}>
        <p className={style.menu_welcome_title}>Menu</p>
        <p className={style.menu_welcome_subtitle}>
          Lacus lobortis nullam nam consectetur fermentum mattis pellentesque id
          nulla. Risus convallis iaculis risus ac aliquam sit ultricies.
          Adipiscing adipiscing pellentesque tincidunt vitae. Aliquam dolor
          egestas nam congue elit dolor.
        </p>
        <p style={{ color: "crimson", display: apiError ? "block" : "none" }}>
          {apiError}
        </p>
      </div>

      <MenuContentAll
        dataBig={dataBig}
        dataMid={dataMid}
        dataSmall={dataSmall}
        showPizzaData={showPizzaData}
      />

      <div
        style={{ display: pizza ? "block" : "none" }}
        className={style.menu_modal}
      >
        <MenuModal
          setPizza={setPizza}
          setInput={setInput}
          img={pizza.img}
          name={pizza.name}
          price={pizza.price}
          description={pizza.description}
          input={input}
          addPizzaToCart={req_addPizzaToCart}
          notify={notify}
        />
      </div>

      <img
        src="./img/allpizzabutton.svg"
        alt="button"
        width="50px"
        height="50px"
        onClick={() => navigate("/fullmenu")}
        className={style.menu_container_button}
      />
    </div>
  );
}
