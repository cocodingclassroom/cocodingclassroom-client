import "./components/register";
import { Router } from "@vaadin/router";


window.onload = () => {
  const routes = [
    {
      path: "/",
      component: "cc-setup",
    },
    {
      path: "/classroom/:id",
      component: "cc-classroom",
    },
  ];
  const outlet = document.getElementById("outlet");
  const router = new Router(outlet);
  router.setRoutes(routes);
};
