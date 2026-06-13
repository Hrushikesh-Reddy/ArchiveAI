import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownComponent({ content }: { content: string }) {
    return (
        <article className="prose prose-base dark:prose-invert min-w-full text-justify pl-2">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => (
                        <p className="text-justify">{children}</p>
                    ),
                }}
            /* components={{
                h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>
                ),

                h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold mt-5 mb-3">{children}</h2>
                ),

                p: ({ children }) => (
                    <p className="leading-7 mb-2">{children}</p>
                ),

                li: ({ children }) => (
                    <li className="mb-2">{children}</li>
                ),

                a: ({ href, children }) => (
                    <a
                        href={href}
                        className="text-blue-500 underline"
                        target="_blank"
                    >
                        {children}
                    </a>
                ),
            }} */
            >
                {content}
            </ReactMarkdown>
        </article>
    );
};


/* export default function MarkdownComponent({ content }) {
    return (
        <main className="flex justify-center py-10">
            {/* The "prose" class targets all child elements (h1, p, li, etc.) *///}
//<article className="prose prose-slate lg:prose-xl dark:prose-invert">
//  <ReactMarkdown>{content}</ReactMarkdown>
//</article>
//</main>
//);
//} */