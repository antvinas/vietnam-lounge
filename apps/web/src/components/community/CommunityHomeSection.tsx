import CategoryTabs from "./CategoryTabs";
import FiltersBar from "./FiltersBar";
import PostList from "./PostList";

export default function CommunityHomeSection() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">라운지 커뮤니티</h1>
      <CategoryTabs />
      <FiltersBar />
      <PostList />
    </div>
  );
}
