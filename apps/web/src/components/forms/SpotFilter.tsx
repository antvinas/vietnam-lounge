import { FaSearch } from "react-icons/fa";

const SpotFilter = () => {
  return (
    <div className="w-full rounded-xl bg-white p-4 shadow-lg dark:bg-gray-800 md:flex md:items-center md:gap-4">
      {/* 지역 */}
      <select className="w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white md:w-auto">
        <option>전체 베트남</option>
        <option>북부 - 하노이</option>
        <option>북부 - 닌빈</option>
        <option>북부 - 하롱베이</option>
        <option>북부 - 하이퐁</option>
        <option>중부 - 다낭</option>
        <option>중부 - 호이안</option>
        <option>중부 - 달랏</option>
        <option>남부 - 호치민</option>
        <option>남부 - 푸꾸옥</option>
      </select>

      {/* 카테고리 */}
      <select className="w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white md:w-auto">
        <option>전체 카테고리</option>
        <option>호텔</option>
        <option>레스토랑</option>
        <option>카페 & 브런치</option>
        <option>나이트라이프</option>
        <option>스파 & 마사지</option>
        <option>관광 & 문화</option>
        <option>쇼핑</option>
        <option>액티비티</option>
      </select>

      {/* 정렬 */}
      <select className="w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white md:w-auto">
        <option>기본순</option>
        <option>평점순</option>
        <option>거리순</option>
      </select>

      {/* 검색 */}
      <div className="relative w-full md:flex-grow">
        <input
          type="text"
          placeholder="스팟 이름 검색..."
          className="w-full rounded-lg border p-2 pr-10 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {/* 영업중 토글 */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <input type="checkbox" className="accent-primary" />
        영업중만
      </label>

      <button className="w-full rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 md:w-auto">
        검색
      </button>
    </div>
  );
};

export default SpotFilter;
