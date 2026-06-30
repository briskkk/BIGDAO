export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          institution: string | null;
          account_type: Database["public"]["Enums"]["account_type"];
          currency: string;
          market: Database["public"]["Enums"]["market_type"];
          owner_name: string | null;
          is_active: boolean;
          is_included_in_net_worth: boolean;
          is_included_in_investable_assets: boolean;
          liquidity_status: Database["public"]["Enums"]["liquidity_status"];
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["accounts"]["Row"]> & { family_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Row"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          family_id: string;
          actor_user_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: Database["public"]["Enums"]["audit_action"];
          before_data: Json | null;
          after_data: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & { family_id: string; entity_type: string; action: Database["public"]["Enums"]["audit_action"] };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
      };
      families: {
        Row: { id: string; name: string; base_currency: string; timezone: string; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["families"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["families"]["Row"]>;
      };
      family_members: {
        Row: { id: string; family_id: string; user_id: string; role: Database["public"]["Enums"]["family_role"]; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["family_members"]["Row"]> & { family_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["family_members"]["Row"]>;
      };
      fx_rates: {
        Row: { id: string; base_currency: string; quote_currency: string; rate: string; quote_time: string; source: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["fx_rates"]["Row"]> & { base_currency: string; quote_currency: string; rate: string; quote_time: string };
        Update: Partial<Database["public"]["Tables"]["fx_rates"]["Row"]>;
      };
      goals: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          target_amount: string;
          currency: string;
          current_age: number;
          target_age: number;
          target_date: string | null;
          monthly_contribution: string;
          expected_annual_return: string;
          include_account_ids: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["goals"]["Row"]> & { family_id: string; name: string; target_amount: string; current_age: number; target_age: number };
        Update: Partial<Database["public"]["Tables"]["goals"]["Row"]>;
      };
      import_batches: {
        Row: {
          id: string;
          family_id: string;
          account_id: string | null;
          filename: string;
          source_type: string;
          uploaded_at: string;
          imported_at: string | null;
          total_rows: number;
          valid_rows: number;
          invalid_rows: number;
          duplicate_rows: number;
          status: Database["public"]["Enums"]["import_status"];
          created_by: string | null;
          metadata: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["import_batches"]["Row"]> & { family_id: string; filename: string };
        Update: Partial<Database["public"]["Tables"]["import_batches"]["Row"]>;
      };
      instruments: {
        Row: {
          id: string;
          family_id: string;
          symbol: string;
          name: string;
          asset_type: Database["public"]["Enums"]["asset_type"];
          market: Database["public"]["Enums"]["market_type"];
          currency: string;
          isin: string | null;
          provider_codes: Json;
          is_manual_valuation: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["instruments"]["Row"]> & { family_id: string; symbol: string; name: string; asset_type: Database["public"]["Enums"]["asset_type"] };
        Update: Partial<Database["public"]["Tables"]["instruments"]["Row"]>;
      };
      manual_valuations: {
        Row: {
          id: string;
          family_id: string;
          account_id: string;
          instrument_id: string;
          valuation_date: string;
          value_amount: string;
          currency: string;
          fx_rate_to_base: string;
          source: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["manual_valuations"]["Row"]> & { family_id: string; account_id: string; instrument_id: string; valuation_date: string; value_amount: string };
        Update: Partial<Database["public"]["Tables"]["manual_valuations"]["Row"]>;
      };
      profiles: {
        Row: { id: string; display_name: string | null; avatar_url: string | null; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      quotes: {
        Row: {
          id: string;
          instrument_id: string;
          quote_time: string;
          price: string;
          currency: string;
          source: string;
          quote_type: Database["public"]["Enums"]["quote_type"];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quotes"]["Row"]> & { instrument_id: string; quote_time: string; price: string; currency: string };
        Update: Partial<Database["public"]["Tables"]["quotes"]["Row"]>;
      };
      transactions: {
        Row: {
          id: string;
          family_id: string;
          account_id: string;
          instrument_id: string | null;
          transaction_type: Database["public"]["Enums"]["transaction_type"];
          trade_at: string;
          settle_at: string | null;
          quantity: string;
          price: string;
          gross_amount: string;
          fee_amount: string;
          tax_amount: string;
          currency: string;
          fx_rate_to_base: string;
          cash_amount: string;
          reference_no: string | null;
          notes: string | null;
          source: Database["public"]["Enums"]["transaction_source"];
          import_batch_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]> & { family_id: string; account_id: string; transaction_type: Database["public"]["Enums"]["transaction_type"]; trade_at: string };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
      };
    };
    Enums: {
      account_type: "brokerage" | "bank" | "fund_platform" | "cash" | "property" | "private_equity" | "insurance" | "other";
      asset_type: "stock" | "etf" | "mutual_fund" | "bond" | "gold" | "cash" | "property" | "private_equity" | "crypto" | "other";
      audit_action: "create" | "update" | "delete" | "import" | "restore";
      family_role: "owner" | "editor" | "viewer";
      import_status: "uploaded" | "validated" | "imported" | "partially_imported" | "failed" | "reverted";
      liquidity_status: "liquid" | "restricted" | "illiquid";
      market_type: "CN" | "HK" | "US" | "FUND" | "OTC" | "OTHER";
      quote_type: "realtime" | "delayed" | "nav" | "estimated_nav" | "manual";
      transaction_source: "manual" | "csv_import" | "seed" | "api_future";
      transaction_type: "buy" | "sell" | "subscribe" | "redeem" | "dividend" | "interest" | "transfer_in" | "transfer_out" | "fx_exchange" | "fee" | "adjustment" | "valuation_update";
    };
  };
};
