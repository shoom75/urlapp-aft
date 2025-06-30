import React, { useState } from "react";
import Hello from "./components/hello";
import MyForm from "./components/MyForm";
import Counter from "./components/Counter";
import Profile from "./components/Profile";
import Greeting from "./components/Greeting";
import ChildInput from "./components/ChildInput";
import ChildButton from "./components/ChildButton";
import Input from "./components/Input";

// 🔧 ここで定義！
const users = [
  { name: "紙", message: "オフェンス", avatar: "https://example.com/kami.png" },
  { name: "石", message: "ディフェンス", avatar: "https://example.com/ishi.png" },
  { name: "はさみ", message: "サポート", avatar: "https://example.com/hasami.png" },
];

function App() {
  const [text,setText] = useState("");

const hendleTextChange = (value) => {
  setText(value)


  }

  const   handleClick = () =>{
    alert("親が呼ばれた")
  }

  return (
    <div className="space-y-4 p-4">
      <Hello />
      <MyForm />
      <Counter />
      <p>test</p>
      {users.map((user, index) => (
        <Profile
          key={index}
          name={user.name}
          message={user.message}
          avatar={user.avatar}
        />        
      ))}
      <Greeting name = "左手" />
      <Greeting name = "右手" />
      <div className ="p-4 space-y-4">
        <ChildInput onSend={hendleTextChange} />
        <p className="text-lg">受け取ったテキスト : {text}</p>
      </div>
       <ChildButton onButtonClick={handleClick} />;
      <Input />

    </div>
  );
}

export default App;