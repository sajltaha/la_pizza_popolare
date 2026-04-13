export const addNewUser = (
  signinUsername,
  signinEmail,
  signinPassword,
  setSigninPassword,
  setSigninEmail,
  setSigninUsername,
  notify
) => {
  let userObj = {
    username: signinUsername,
    email: signinEmail,
    password: signinPassword,
    cart: [],
  };
  let usersList = JSON.parse(localStorage.getItem("Users")) || [];
  if (usersList.length === 0) {
    localStorage.setItem("Users", JSON.stringify([...usersList, userObj]));
    notify("Successfully registered!", "succ");
  } else {
    const userExists = usersList.some(
      (user) =>
        user.username === userObj.username || user.email === userObj.email
    );

    if (userExists) {
      notify("User already exists!", "err");
    } else {
      localStorage.setItem("Users", JSON.stringify([...usersList, userObj]));
      notify("Successfully registered!", "succ");
    }
  }
  setSigninPassword("");
  setSigninUsername("");
  setSigninEmail("");
};

export const enterShop = (
  loginUsername,
  loginPassword,
  navigate,
  setLoginPassword,
  setLoginUsername,
  notify
) => {
  let userObj = {
    username: loginUsername,
    password: loginPassword,
    email: "",
    cart: [],
  };

  let usersList = JSON.parse(localStorage.getItem("Users")) || [];

  if (usersList.length === 0) {
    notify("User doesn't exist!", "err");
  } else {
    const userExists = usersList.some(
      (user) =>
        user.username === userObj.username && user.password === userObj.password
    );

    if (!userExists) {
      notify("Wrong username or password!", "err");
    } else {
      const userFromStorage = usersList.find(
        (user) =>
          user.username === userObj.username &&
          user.password === userObj.password
      );
      userObj.cart = userFromStorage.cart;
      userObj.email = userFromStorage.email;
      localStorage.setItem("Current user", JSON.stringify(userObj));
      navigate("/shopping");
    }
  }
  setLoginPassword("");
  setLoginUsername("");
};
