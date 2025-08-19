import { createClient } from "./supabase/clinet";
import { Board, Column } from "./supabase/model";
import {SupabaseClient} from "@supabase/supabase-js";

// const supabase = createClient();

export const boardServices = {
    async getBoard(supabase: SupabaseClient, boardId: string): Promise<Board> {
        const { data, error } = await supabase
            .from("boards")
            .select("*")
            .eq("id", boardId)
            .single()

        if (error) throw error;

        return data;
    },


    async getBoards(supabase: SupabaseClient, userId: string): Promise<Board[]> {
        const { data, error } = await supabase
            .from("boards")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", {ascending: false});

        if (error) throw error;

        return data || [];
    },

    async createBoard (supabase: SupabaseClient, board: Omit<Board, "id" | "created_at" | "updated_at" >): Promise<Board> {
        const { data, error } = await supabase
            .from("boards")
            .insert(board)
            .select()
            .single();

            if (error) throw error;

            return data;
    }
}


export const columnServices = {
    async getColumns(supabase: SupabaseClient, boardId: string): Promise<Column[]> {
        const { data, error } = await supabase
            .from("columns")
            .select("*")
            .eq("board_id", boardId)
            .order("sort_order", {ascending: true});

        if (error) throw error;

        return data || [];
    },

    async createColumn (supabase: SupabaseClient, column: Omit<Column, "id" | "created_at" >): Promise<Column> {
        const { data, error } = await supabase
            .from("columns")
            .insert(column)
            .select()
            .single();

            if (error) throw error;

            return data;
    }
};

export const boardDataServices = {

    async getBoardWithColumns (supabase: SupabaseClient, boardId: string) {
        const [board, columns] = await Promise.all([
            boardServices.getBoard(supabase, boardId),
            columnServices.getColumns(supabase, boardId)
        ]);

        if (!board) throw new Error("Board not found");

        return {
            board,
            columns
        }
    },


    async createBoardWithDefaultColumns (supabase: SupabaseClient ,boardData: {
        title: string,
        description?: string,
        color?: string,
        userId: string
    }) {
        const board = await boardServices.createBoard(supabase, {
            title: boardData.title,
            description: boardData.description || null,
            color: boardData.color || "bg-blue-500",
            user_id: boardData.userId
        });

        const defaultColumns = [
            {title: "To DO", sort_order: 0},
            {title: "In Progress", sort_order: 1},
            {title: "In Review", sort_order: 2},
            {title: "Done", sort_order: 3},
        ];

        await Promise.all(defaultColumns.map((column) => columnServices.createColumn(supabase,  { 
            ...column,
            board_id: board.id,
            user_id: boardData.userId
        })));

        return board;
    }
};