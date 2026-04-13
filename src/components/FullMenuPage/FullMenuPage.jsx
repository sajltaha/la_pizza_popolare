import { useEffect, useState } from "react";
import style from "./FullMenuPage.module.css";
import { useNavigate } from "react-router-dom";
import { addPizzaToCart } from "../../libs/Menu_functions";
import MenuModal from "../ShoppingPage/nodes/Menu/nodes/MenuModal/MenuModal";
import FullMenuContentAll from "./nodes/FullMenuContentAll/FullMenuContentAll";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchPizzas } from "../../libs/backendApi";

export default function FullMenuPage() {
  const [allPizzas, setAllPizzas] = useState([]);
  const [data, setData] = useState([]);
  const [pizza, setPizza] = useState("");
  const [countInput, setCountInput] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [selectValue, setSelectValue] = useState("All");
  const [alert, setAlert] = useState(false);
  const [apiError, setApiError] = useState("");

  const navigate = useNavigate();

  const notify = () => toast.success("Succesfully added to cart!");

  useEffect(() => {
    let ignore = false;

    const loadPizzas = async () => {
      try {
        const pizzas = await fetchPizzas();

        if (ignore) {
          return;
        }

        setAllPizzas(pizzas);
        setData(pizzas);
        setApiError("");
      } catch (error) {
        if (ignore) {
          return;
        }

        setApiError("Failed to load pizzas from backend API.");
        toast.error("Unable to load full menu.");
      }
    };

    loadPizzas();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const filteredData = searchInput
      ? allPizzas.filter((pizza) =>
          pizza.name.toLowerCase().includes(searchInput.toLowerCase())
        )
      : allPizzas;

    const sortedData =
      selectValue === "All"
        ? filteredData
        : [...filteredData].sort((a, b) =>
            selectValue === "Price"
              ? a.price - b.price
              : a.name.localeCompare(b.name)
          );

    setData(sortedData);
    setAlert(Boolean(searchInput) && sortedData.length === 0);
  }, [allPizzas, searchInput, selectValue]);

  const showPizzaData = (id) => {
    const findPizza = data.find((pizza) => pizza.id === id);
    setPizza(findPizza);
  };

  const req_addPizzaToCart = () => {
    addPizzaToCart(
      pizza.id,
      countInput,
      pizza.name,
      pizza.price,
      pizza.img,
      setPizza,
      setCountInput
    );
  };

  return (
    <>
      <div className={style.fullMenu_container}>
        <div className={style.fullMenu_welcome}>
          <p className={style.fullMenu_welcome_title}>Menu</p>
          <p className={style.fullMenu_welcome_subtitle}>
            Lacus lobortis nullam nam consectetur fermentum mattis pellentesque
            id nulla. Risus convallis iaculis risus ac aliquam sit ultricies.
            Adipiscing adipiscing pellentesque tincidunt vitae. Aliquam dolor
            egestas nam congue elit dolor.
          </p>
          <p style={{ color: "crimson", display: apiError ? "block" : "none" }}>
            {apiError}
          </p>
        </div>
        <FullMenuContentAll
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          setSelectValue={setSelectValue}
          data={data}
          showPizzaData={showPizzaData}
          alert={alert}
        />
        <div
          className={style.fullMenu_modal}
          style={{ display: pizza ? "block" : "none" }}
        >
          <MenuModal
            setPizza={setPizza}
            setInput={setCountInput}
            img={pizza.img}
            name={pizza.name}
            description={pizza.description}
            price={pizza.price}
            input={countInput}
            addPizzaToCart={req_addPizzaToCart}
            notify={notify}
          />
        </div>
        <img
          src="./img/allpizzabutton.svg"
          alt="button"
          width="50px"
          height="50px"
          onClick={() => navigate("/shopping")}
          className={style.fullMenu_container_button}
        />
      </div>
    </>
  );
}
