import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Database } from "@/types/database";
import { Users, Check } from "lucide-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface PersonFilterProps {
    members: Profile[];
    selectedUserId: string | null;
    onSelectUserId: (id: string | null) => void;
}

export function PersonFilter({
    members,
    selectedUserId,
    onSelectUserId,
}: PersonFilterProps) {
    const selectedMember = members.find((m) => m.id === selectedUserId);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "relative h-9 w-9 rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selectedUserId === null
                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                            : ""
                    )}
                >
                    {selectedUserId === null ? (
                        <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed border-primary/50">
                            <Users className="h-4 w-4" />
                        </div>
                    ) : (
                        <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                            <AvatarImage src={selectedMember?.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {(selectedMember?.nome || "U")[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filtrar por pessoa</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => onSelectUserId(null)}
                    className="gap-2 cursor-pointer"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="h-4 w-4" />
                    </div>
                    <span className="flex-1">Todos</span>
                    {selectedUserId === null && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {members.map((member) => (
                    <DropdownMenuItem
                        key={member.id}
                        onClick={() => onSelectUserId(member.id)}
                        className="gap-2 cursor-pointer"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                                {member.nome.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate">{member.nome}</span>
                        {selectedUserId === member.id && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
