import React from "react";
import Side from "./Side";
import Content from "./Content";

const Test = () => {
  return (
    <div className="mx-auto max-w-6xl py-12 px-12">
      <main className="flex gap-8">
        <aside>
          <Side />
        </aside>
        <div className="flex-1">
          <Content />
        </div>
      </main>
    </div>
  );
};

export default Test;
