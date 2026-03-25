import { renderToString } from "react-dom/server";
import { DayPicker } from "react-day-picker";
import React from "react";

console.log(renderToString(React.createElement(DayPicker)));
