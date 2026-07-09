import { CsvRow } from "../../src/services/csv/csv.types";

export class CsvRowBuilder {
    private readonly row: CsvRow = {
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        company: "Acme Corp"
    };

    public withField(column: string, value: string): this {
        this.row[column] = value;
        return this;
    }

    public withEmail(email: string): this {
        this.row.email = email;
        return this;
    }

    public withName(name: string): this {
        this.row.name = name;
        return this;
    }

    public build(): CsvRow {
        return { ...this.row };
    }
}
