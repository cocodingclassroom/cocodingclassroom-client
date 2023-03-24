import "./components/register";
import { Router } from "@vaadin/router";

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
export const router = new Router(outlet);
router.setRoutes(routes);
