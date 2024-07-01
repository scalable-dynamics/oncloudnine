import { Table } from "./Table.js";

interface CardProps {
    data: any;
    title?: string;
    properties?: string[];
}

export function Card(props: CardProps) {
    let { data, title, properties } = props;
    if (!data) return null; 
    if (Array.isArray(data)) {
        if(data.length > 1) return <Table data={data} />;
        data = data[0];
    }
    if(!data) data = {};
    if (!properties) properties = Object.keys(data);

    return (
        <div class="card">
            {title && <h2>{title}</h2>}
            <dl class="card-content">
                {properties.map((column) => (
                    <>
                        <dt>{column}</dt>
                        {data[column] && <dd>{formatValue(data[column])}</dd>}
                    </>
                ))}
            </dl>
        </div>
    );

    function formatValue(value: any) {
        if (typeof (value) === 'object') {
            if (value instanceof Date) {
                return value.toLocaleDateString();
            }
            return <Card data={value} />;
        }
        return value?.toString() || '';
    }
}