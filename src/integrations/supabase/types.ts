export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          owner_id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          owner_id: string
          product_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favorite_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_users: {
        Row: {
          created_at: string
          favorite_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_users_favorite_user_id_fkey"
            columns: ["favorite_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          id: string
          kyc_case_id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          kyc_case_id: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          kyc_case_id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_audit_log_kyc_case_id_fkey"
            columns: ["kyc_case_id"]
            isOneToOne: false
            referencedRelation: "kyc_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_cases: {
        Row: {
          attempts_count: number
          created_at: string
          decided_at: string | null
          decided_by_admin_id: string | null
          id: string
          level_required: string
          provider_case_id: string | null
          provider_name: string | null
          public_id: string
          rejection_reason: string | null
          risk_score: number
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
          user_role: string
        }
        Insert: {
          attempts_count?: number
          created_at?: string
          decided_at?: string | null
          decided_by_admin_id?: string | null
          id?: string
          level_required?: string
          provider_case_id?: string | null
          provider_name?: string | null
          public_id?: string
          rejection_reason?: string | null
          risk_score?: number
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          user_role?: string
        }
        Update: {
          attempts_count?: number
          created_at?: string
          decided_at?: string | null
          decided_by_admin_id?: string | null
          id?: string
          level_required?: string
          provider_case_id?: string | null
          provider_name?: string | null
          public_id?: string
          rejection_reason?: string | null
          risk_score?: number
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          kyc_case_id: string
          mime_type: string | null
          uploaded_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          kyc_case_id: string
          mime_type?: string | null
          uploaded_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          kyc_case_id?: string
          mime_type?: string | null
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_kyc_case_id_fkey"
            columns: ["kyc_case_id"]
            isOneToOne: false
            referencedRelation: "kyc_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description_en: string | null
          description_ro: string | null
          id: string
          is_read: boolean
          link: string | null
          title_en: string | null
          title_ro: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_ro?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          title_en?: string | null
          title_ro: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_ro?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          title_en?: string | null
          title_ro?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ops_ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string | null
          ticket_id: string
          uploaded_by_id: string | null
          uploaded_by_type: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id?: string | null
          ticket_id: string
          uploaded_by_id?: string | null
          uploaded_by_type?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string | null
          ticket_id?: string
          uploaded_by_id?: string | null
          uploaded_by_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_ticket_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ops_ticket_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ops_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_ticket_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          ticket_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_ticket_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ops_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_ticket_messages: {
        Row: {
          author_id: string | null
          author_type: string
          created_at: string
          id: string
          is_internal: boolean | null
          message_text: string
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          author_type: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message_text: string
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          author_type?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message_text?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ops_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_tickets: {
        Row: {
          assigned_to: string | null
          category_group: string
          category_type: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          owner_user_id: string | null
          priority: string
          product_id: string | null
          public_id: string
          rental_user_id: string | null
          requester_user_id: string | null
          reservation_id: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category_group: string
          category_type: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          owner_user_id?: string | null
          priority?: string
          product_id?: string | null
          public_id?: string
          rental_user_id?: string | null
          requester_user_id?: string | null
          reservation_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category_group?: string
          category_type?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          owner_user_id?: string | null
          priority?: string
          product_id?: string | null
          public_id?: string
          rental_user_id?: string | null
          requester_user_id?: string | null
          reservation_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_tickets_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          name_en: string | null
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          name_en?: string | null
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          name_en?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "platform_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          rating_communication: number | null
          rating_product_condition: number | null
          rating_punctuality: number | null
          review_type: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          rating_communication?: number | null
          rating_product_condition?: number | null
          rating_punctuality?: number | null
          review_type?: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          rating_communication?: number | null
          rating_product_condition?: number | null
          rating_punctuality?: number | null
          review_type?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_flagged: boolean
          category: string | null
          created_at: string | null
          daily_price_owner: number
          description: string | null
          flag_reason: string | null
          id: string
          images: string[] | null
          included_items: string[] | null
          is_active: boolean
          location_city: string | null
          location_country: string | null
          owner_id: string
          pickup_address: string | null
          platform_fee_percent: number
          slug: string | null
          subcategory: string | null
          title: string
        }
        Insert: {
          admin_flagged?: boolean
          category?: string | null
          created_at?: string | null
          daily_price_owner: number
          description?: string | null
          flag_reason?: string | null
          id?: string
          images?: string[] | null
          included_items?: string[] | null
          is_active?: boolean
          location_city?: string | null
          location_country?: string | null
          owner_id: string
          pickup_address?: string | null
          platform_fee_percent?: number
          slug?: string | null
          subcategory?: string | null
          title: string
        }
        Update: {
          admin_flagged?: boolean
          category?: string | null
          created_at?: string | null
          daily_price_owner?: number
          description?: string | null
          flag_reason?: string | null
          id?: string
          images?: string[] | null
          included_items?: string[] | null
          is_active?: boolean
          location_city?: string | null
          location_country?: string | null
          owner_id?: string
          pickup_address?: string | null
          platform_fee_percent?: number
          slug?: string | null
          subcategory?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          company_address: string | null
          company_name: string | null
          created_at: string | null
          cui: string | null
          deactivation_token: string | null
          deactivation_token_expires_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean
          is_deactivated: boolean
          kyc_last_verified_at: string | null
          kyc_level: string
          kyc_status: string
          phone: string | null
          reg_com: string | null
          whatsapp: string | null
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string | null
          cui?: string | null
          deactivation_token?: string | null
          deactivation_token_expires_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_banned?: boolean
          is_deactivated?: boolean
          kyc_last_verified_at?: string | null
          kyc_level?: string
          kyc_status?: string
          phone?: string | null
          reg_com?: string | null
          whatsapp?: string | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string | null
          cui?: string | null
          deactivation_token?: string | null
          deactivation_token_expires_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean
          is_deactivated?: boolean
          kyc_last_verified_at?: string | null
          kyc_level?: string
          kyc_status?: string
          phone?: string | null
          reg_com?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          daily_price: number
          end_date: string
          id: string
          owner_id: string | null
          owner_payout: number
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          platform_fee: number
          platform_fee_percent: number
          product_id: string | null
          rental_days: number
          renter_id: string | null
          start_date: string
          status: string
          subtotal: number
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          daily_price: number
          end_date: string
          id?: string
          owner_id?: string | null
          owner_payout: number
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          platform_fee: number
          platform_fee_percent?: number
          product_id?: string | null
          rental_days: number
          renter_id?: string | null
          start_date: string
          status?: string
          subtotal: number
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          daily_price?: number
          end_date?: string
          id?: string
          owner_id?: string | null
          owner_payout?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          platform_fee?: number
          platform_fee_percent?: number
          product_id?: string | null
          rental_days?: number
          renter_id?: string | null
          start_date?: string
          status?: string
          subtotal?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rentals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          related_product_id: string | null
          related_rental_id: string | null
          resolution: string | null
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          related_product_id?: string | null
          related_rental_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          related_product_id?: string | null
          related_rental_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          processed_at: string | null
          rental_id: string | null
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          processed_at?: string | null
          rental_id?: string | null
          status?: string
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          processed_at?: string | null
          rental_id?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_slug: { Args: { title: string }; Returns: string }
      get_admin_financial_summary: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          completed_rentals: number
          owner_payouts: number
          pending_payments: number
          platform_fees: number
          total_revenue: number
        }[]
      }
      get_admin_kyc_cases: {
        Args: {
          level_filter?: string
          limit_count?: number
          offset_count?: number
          role_filter?: string
          search_query?: string
          status_filter?: string
        }
        Returns: {
          attempts_count: number
          created_at: string
          decided_at: string
          id: string
          level_required: string
          provider_name: string
          public_id: string
          rejection_reason: string
          risk_score: number
          status: string
          submitted_at: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string
          user_role: string
        }[]
      }
      get_admin_products: {
        Args: {
          category_filter?: string
          limit_count?: number
          offset_count?: number
          search_query?: string
          status_filter?: string
        }
        Returns: {
          admin_flagged: boolean
          approval_status: string
          category: string
          created_at: string
          daily_price_owner: number
          description: string
          flag_reason: string
          id: string
          images: string[]
          is_active: boolean
          location_city: string
          owner_id: string
          owner_name: string
          slug: string
          subcategory: string
          title: string
        }[]
      }
      get_admin_rentals: {
        Args: {
          limit_count?: number
          offset_count?: number
          status_filter?: string
        }
        Returns: {
          category: string
          created_at: string
          daily_price: number
          end_date: string
          id: string
          location_city: string
          owner_id: string
          owner_name: string
          owner_payout: number
          payment_status: string
          platform_fee: number
          product_id: string
          product_title: string
          rental_days: number
          renter_id: string
          renter_name: string
          start_date: string
          status: string
          subtotal: number
        }[]
      }
      get_admin_stats: {
        Args: never
        Returns: {
          active_rentals: number
          pending_kyc: number
          revenue_this_month: number
          total_products: number
          total_rentals: number
          total_users: number
        }[]
      }
      get_admin_users: {
        Args: {
          limit_count?: number
          offset_count?: number
          search_query?: string
        }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          kyc_status: string
          phone: string
          products_count: number
          rentals_count: number
          user_role: string
        }[]
      }
      get_booked_dates: {
        Args: { p_product_id: string }
        Returns: {
          end_date: string
          start_date: string
        }[]
      }
      get_contact_info_if_in_conversation: {
        Args: { owner_uuid: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          phone: string
          whatsapp: string
        }[]
      }
      get_product_owner_public_info: {
        Args: { owner_uuid: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_rental_renter_info: {
        Args: { renter_ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_user_conversations: {
        Args: { user_uuid: string }
        Returns: {
          buyer_id: string
          created_at: string
          id: string
          last_message_content: string
          last_message_created_at: string
          last_message_sender_id: string
          other_user_avatar: string
          other_user_id: string
          other_user_name: string
          owner_id: string
          product_id: string
          product_images: string[]
          product_title: string
          unread_count: number
          updated_at: string
        }[]
      }
      get_user_given_reviews_with_targets: {
        Args: { target_user_id: string }
        Returns: {
          comment: string
          created_at: string
          id: string
          rating: number
          reviewed_avatar_url: string
          reviewed_full_name: string
          reviewed_user_id: string
          reviewer_id: string
        }[]
      }
      get_user_reviews_with_reviewers: {
        Args: { target_user_id: string }
        Returns: {
          comment: string
          created_at: string
          id: string
          rating: number
          reviewed_user_id: string
          reviewer_avatar_url: string
          reviewer_full_name: string
          reviewer_id: string
        }[]
      }
      get_user_statistics: {
        Args: { target_user_id: string }
        Returns: {
          average_rating: number
          member_since: string
          products_count: number
          reviews_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_favorite: { Args: { target_user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      search_users_by_name: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          products_count: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
