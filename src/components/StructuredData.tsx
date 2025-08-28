// src/components/StructuredData.tsx
export default function StructuredData({ json }: { json: unknown }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
        />
    );
}
