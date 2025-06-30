import { useState } from "react"

function Input(){
    const[input,setinput] = useState("")
    return(
        <div>
        <input
         type="text" 
         value={input}
        onChange = {(e) => setinput(e.target.value)}
        
        />
        <p> テキスト　:　{input}</p>
           </div> 
    )
} 

export default Input;