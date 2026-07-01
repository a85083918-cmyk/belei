import type { StoreItem } from "./homeData";
import { getPhotoUrl } from "./homeUtils";

export default function MobileHotList({
  stores,
  onSearch,
}: {
  stores: StoreItem[];
  onSearch: (value: string) => void;
}) {
  return (
    <div className="rounded-[26px] border border-stone-200 bg-white p-5 text-left shadow-[5px_5px_0_#ead8b5]">
      <h2 className="text-2xl font-black">🔥 熱門搜尋 TOP 5</h2>

      <div className="mt-5 space-y-3">
        {stores.slice(0, 5).map((store, index) => {
          const photoUrl = getPhotoUrl(store.photoName);

          return (
            <button
              key={store.query}
              onClick={() => onSearch(store.query)}
              className="flex w-full items-center gap-3 rounded-2xl bg-stone-50 p-3 text-left transition hover:bg-orange-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-black text-white">
                {index + 1}
              </div>

              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-200">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={store.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">🍽️</div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-black text-stone-900">
                  {store.name}
                </div>

                <div className="truncate text-xs font-bold text-stone-500">
                  {store.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}