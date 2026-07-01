import type { StoreItem } from "./homeData";
import { getPhotoUrl } from "./homeUtils";

export default function HomeCard({
  title,
  subtitle,
  stores,
  onSearch,
}: {
  title: string;
  subtitle: string;
  stores: StoreItem[];
  onSearch: (value: string) => void;
}) {
  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-8 text-left shadow-sm">
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-bold text-stone-500">{subtitle}</p>

      <div className="mt-8 space-y-4">
        {stores.map((store) => {
          const photoUrl = getPhotoUrl(store.photoName);

          return (
            <button
              key={store.query}
              onClick={() => onSearch(store.query)}
              className="w-full overflow-hidden rounded-2xl bg-stone-50 text-left shadow-sm transition hover:bg-orange-50"
            >
              <div className="h-28 w-full bg-stone-200">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={store.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    餐
                  </div>
                )}
              </div>

              <div className="px-5 py-4">
                <div className="text-xl font-black text-stone-700">
                  {store.name}
                </div>
                <div className="mt-1 text-sm font-bold text-stone-400">
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