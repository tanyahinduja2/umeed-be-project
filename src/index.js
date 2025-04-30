import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react"; // Import ChakraProvider
import { system } from "@chakra-ui/react/preset";
import "./index.css";
import App from "./App";
import { ContextProvider } from "./Context";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <ContextProvider>
      <ChakraProvider value={system}>
        {" "}
        {/* Wrap App inside ChakraProvider */}
        <App />
      </ChakraProvider>
    </ContextProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
