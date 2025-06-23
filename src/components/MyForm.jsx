import React, { useState } from 'react';

function MyForm() {
  // フォームの入力値を管理するState
  const [inputValue, setInputValue] = useState('初期状態');

  // フォーム送信時の処理
  const handleSubmit = (e) => {
    e.preventDefault();  // ページリロードを防ぐ
    alert(`送信された値: ${inputValue}`);
  };

  // 入力が変わったときにStateを更新
  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        名前:
        <input type="text" value={inputValue} onChange={handleChange} />
      </label>
      <button type="submit">送信</button>
    </form>
  );
}

export default MyForm;
