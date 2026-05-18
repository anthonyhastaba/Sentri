import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  type ColumnDef,
  type Column,
  type FilterFn,
  type Row,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Search,
  Clock,
  Inbox,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CheckSquare,
  Square,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn, formatIncidentId } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { DemoLoader } from "@/components/DemoLoader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { Ticket } from "@shared/schema";

interface IncidentTableProps {
  tickets: Ticket[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
}

const incidentGlobalFilter: FilterFn<Ticket> = (
  row: Row<Ticket>,
  _columnId: string,
  value: string,
) => {
  const q = value.toLowerCase();
  return (
    row.original.title.toLowerCase().includes(q) ||
    (row.original.category?.toLowerCase().includes(q) ?? false)
  );
};

function SortIcon({ column }: { column: Column<Ticket, unknown> }) {
  if (!column.getCanSort()) return null;
  if (column.getIsSorted() === "asc")
    return <ArrowUp className="w-3 h-3 ml-1 inline" />;
  if (column.getIsSorted() === "desc")
    return <ArrowDown className="w-3 h-3 ml-1 inline" />;
  return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />;
}

const columnHelper = createColumnHelper<Ticket>();

export function IncidentTable({
  tickets,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: IncidentTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => (
          <button
            onClick={onToggleSelectAll}
            className="flex items-center justify-center"
          >
            {selectedIds.length === tickets.length && tickets.length > 0 ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <button
            onClick={() => onToggleSelect(row.original.id)}
            className="flex items-center justify-center"
          >
            {selectedIds.includes(row.original.id) ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("ticketNumber", {
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {formatIncidentId(row.original.ticketNumber ?? row.original.id)}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor("title", {
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.title}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        enableSorting: true,
      }),
      columnHelper.accessor("priority", {
        header: "Priority",
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
        enableSorting: true,
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: ({ row }) =>
          row.original.category ? (
            row.original.category
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        enableSorting: true,
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>
              {row.original.createdAt
                ? formatDistanceToNow(new Date(row.original.createdAt), {
                    addSuffix: true,
                  })
                : "Just now"}
            </span>
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link href={"/tickets/" + row.original.id} aria-label="View incident details">
            <ArrowRight className="w-4 h-4" />
          </Link>
        ),
        enableSorting: false,
      }),
    ] as ColumnDef<Ticket, unknown>[],
    [selectedIds, onToggleSelect, onToggleSelectAll]
  );

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: incidentGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const filteredRowCount = table.getFilteredRowModel().rows.length;

  return (
    <div>
      {/* Section header with count badge + search */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Recent Tickets
          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
            {filteredRowCount}
          </span>
        </h2>
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search tickets..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-secondary/50 hover:bg-secondary/50 border-0"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "text-muted-foreground uppercase text-xs font-semibold px-6 py-4",
                        header.column.getCanSort() &&
                          "cursor-pointer select-none"
                      )}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <SortIcon column={header.column} />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y divide-border/50">
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                        <Inbox className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-foreground">
                        No incidents yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Load demo incidents to explore Sentri, or create your
                        first ticket
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <DemoLoader />
                        <Link
                          href="/tickets/new"
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                        >
                          New Incident
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRowCount === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="w-8 h-8 text-muted-foreground/50" />
                      <p className="font-semibold text-foreground">No results found</p>
                      <p className="text-sm text-muted-foreground">No tickets match &ldquo;{globalFilter}&rdquo;</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "border-b border-border/50 hover:bg-muted/5 transition-colors group",
                      selectedIds.includes(row.original.id) && "bg-primary/5"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
