import "./components/register";
import { Router } from "@vaadin/router";

export const DEBUG = true;

export const debugLog = (toLog) => {
  if (DEBUG) {
    console.log(toLog);
  }
};

window.onload = () => {
  const routes = [
    {
      path: "/",
      component: "cc-setup",
    },
    // {
    //   path: "/:id/passwordmissing",
    //   component: "cc-password-setup",
    // },
    {
      path: "/:id",
      component: "cc-classroom",
    },
  ];

  const outlet = document.getElementById("outlet");
  const router = new Router(outlet);
  router.setRoutes(routes);
};
