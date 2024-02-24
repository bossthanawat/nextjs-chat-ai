import ChatSection from "@/app/ChatSection";

export default function Home() {
  return (
    <div className="container mt-20">
      <h3 className="text-xl md:text-3xl font-medium">Chat</h3>
      <span className="text-base text-gray-600">
        Try talking to my assistant.
      </span>
      <div className="mt-4 mx-auto w-full bg-white border [box-shadow:5px_5px_rgb(82_82_82)] rounded-lg overflow-hidden p-2">
        <ChatSection />
      </div>
    </div>
  );
}
