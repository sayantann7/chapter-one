export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 p-4 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Chapter One Platform
        </p>
      </div>

      <div className="relative flex flex-col place-items-center text-center max-w-3xl my-12">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl mb-6">
          Every relationship deserves a <span className="text-rose-600">better first chapter.</span>
        </h1>
        <p className="text-lg leading-8 text-slate-600 mb-8">
          Chapter One replaces endless swiping with thoughtful introductions. Connect through meaningful interactions before appearance becomes the primary focus.
        </p>
        <div className="flex gap-4">
          <div className="rounded-md bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 cursor-pointer">
            Open App
          </div>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-3 lg:text-left gap-6">
        <div className="group rounded-lg border border-slate-200 px-5 py-4 transition-colors hover:border-rose-500 hover:bg-rose-50/50">
          <h2 className="mb-3 text-2xl font-semibold">
            One Introduction{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-70">
            No endless swiping. Discover one carefully matched introduction at a time.
          </p>
        </div>

        <div className="group rounded-lg border border-slate-200 px-5 py-4 transition-colors hover:border-rose-500 hover:bg-rose-50/50">
          <h2 className="mb-3 text-2xl font-semibold">
            Guided Icebreakers{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-70">
            Shared activities and conversation starters to skip the awkward initial &quot;hey&quot;.
          </p>
        </div>

        <div className="group rounded-lg border border-slate-200 px-5 py-4 transition-colors hover:border-rose-500 hover:bg-rose-50/50">
          <h2 className="mb-3 text-2xl font-semibold">
            Progressive Reveal{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-70">
            Profile details and photos unlock naturally through genuine conversation.
          </p>
        </div>
      </div>
    </main>
  );
}
