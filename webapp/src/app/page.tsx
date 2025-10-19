"use client";

import CreateGroup from "@/components/CreateGroup";
import MyGroups from "@/components/MyGroups";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto p-5">
      <Navbar />
      <div className="w-full flex flex-col gap-6">
        <CreateGroup />
        <MyGroups />
      </div>
    </div>
  );
}
