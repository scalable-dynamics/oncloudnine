import { Card } from "./Card.js";

interface TableProps {
    columns?: string[];
    data: IList<any>;
    onSelect?: (item: any) => void;
}

export function Table(props: TableProps) {
    let { columns, data, onSelect } = props;
    const rows = $reference<HTMLTableSectionElement>();
    if (!data) return null;
    if (!columns) {
        columns = Object.keys(data[0]);
    }

    window.setTimeout(addRows, 0);

    return (
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody ref={rows} />
            </table>
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

    function addRow(row: any) {
        if (!rows.value) return;
        const tr = (
            <tr onclick={() => onSelect && onSelect(row)}>
                {columns!.map((column) => (
                    <td title={column}>
                        {formatValue(row[column])}
                    </td>
                ))}
            </tr>
        );
        rows.value.appendChild(tr);
    }

    async function addRows() {
        if (Array.isArray(data)) {
            for (let item of data) {
                addRow(item);
            }
        } else if (typeof (data[Symbol.asyncIterator]) === 'function') {
            const iterator = data as AsyncIterable<any>;
            for await (let item of iterator) {
                addRow(item);
            }
        } else if (typeof (data[Symbol.iterator]) === 'function') {
            const iterator = data as Iterable<any>;
            for (let item of iterator) {
                addRow(item);
            }
        } else if (typeof (data) === 'function') {
            const items = await data();
            for (let item of items) {
                addRow(item);
            }
        } else if (data) {
            throw new Error('Table data source is invalid');
        }
    }
}