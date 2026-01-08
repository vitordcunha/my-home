import { Outlet } from "react-router-dom";
import Header from "./Header";
import BottomNav from "./BottomNav";


export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">

      <Header />
      <main className="flex-1 container px-6 py-8 pb-28 max-w-4xl">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
