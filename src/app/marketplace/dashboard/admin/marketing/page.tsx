import { Button } from "@/components/ui/button";
import Link from "next/link";

const page = () => {
  return (
    <div>
      <h1>Marketing</h1>
      <p>Coming soon</p>
      <Button variant={"outline"} className="">
        <Link href={"/marketplace/dashboard/admin/marketing/banners"}>
          Banner Settings
        </Link>
      </Button>
    </div>
  );
};

export default page;
