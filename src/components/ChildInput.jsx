import { useState } from "react";

function ChildInput({onSend}){
    const [input, setInput] = useState("");

    const hendleSubmit = () =>{
        onSend(input);
        setInput("");
    };
    return(
        <div className="flex items-center gap-2">
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border p-2 rounded"
            placeholder="入力してね"
            />
            <button
                onClick = {hendleSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                   我を押せェ
            </button>
        </div>
    )
}
export default ChildInput;