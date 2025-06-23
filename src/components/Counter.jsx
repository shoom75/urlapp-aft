import React, { useState } from 'react';  // ここで useState をまとめてimport

function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <p>今のカウント : {count}</p>
      <button onClick={increment}>増やす</button>
    </div>
  );
}

export default Counter;
