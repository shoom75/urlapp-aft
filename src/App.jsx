import React from "react";
import Hello from "./components/hello";
import MyForm from "./components/MyForm";
import Counter from "./components/Counter";

function APP(){
  return(
    <div>
      <Hello />
      <MyForm />
      <Counter />
      <p>test</p>
    </div>
  )
}

export default APP;