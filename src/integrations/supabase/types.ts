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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          description_en: string | null
          description_ro: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          link: string | null
          priority: string
          title_en: string | null
          title_ro: string
          type: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_ro?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          priority?: string
          title_en?: string | null
          title_ro: string
          type: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_ro?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          priority?: string
          title_en?: string | null
          title_ro?: string
          type?: string
        }
        Relationships: []
      }
      admin_specializations: {
        Row: {
          category_group: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category_group: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category_group?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      anaf_cache: {
        Row: {
          cui: string
          data: Json
          fetched_at: string
        }
        Insert: {
          cui: string
          data: Json
          fetched_at?: string
        }
        Update: {
          cui?: string
          data?: Json
          fetched_at?: string
        }
        Relationships: []
      }
      banned_identifiers: {
        Row: {
          banned_by: string | null
          created_at: string
          id: string
          identifier_type: string
          reason: string | null
          value: string
        }
        Insert: {
          banned_by?: string | null
          created_at?: string
          id?: string
          identifier_type: string
          reason?: string | null
          value: string
        }
        Update: {
          banned_by?: string | null
          created_at?: string
          id?: string
          identifier_type?: string
          reason?: string | null
          value?: string
        }
        Relationships: []
      }
      chat_notification_cooldown: {
        Row: {
          conversation_id: string
          last_sent_at: string
          recipient_id: string
        }
        Insert: {
          conversation_id: string
          last_sent_at?: string
          recipient_id: string
        }
        Update: {
          conversation_id?: string
          last_sent_at?: string
          recipient_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          buyer_last_read_at: string | null
          created_at: string
          id: string
          owner_id: string
          owner_last_read_at: string | null
          product_id: string
          rentals_id: string | null
          reopened_at: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_last_read_at?: string | null
          created_at?: string
          id?: string
          owner_id: string
          owner_last_read_at?: string | null
          product_id: string
          rentals_id?: string | null
          reopened_at?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_last_read_at?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          owner_last_read_at?: string | null
          product_id?: string
          rentals_id?: string | null
          reopened_at?: string | null
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
          {
            foreignKeyName: "conversations_rentals_id_fkey"
            columns: ["rentals_id"]
            isOneToOne: false
            referencedRelation: "rentals"
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
      kb_article_views: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          category_group: string | null
          content_en: string | null
          content_ro: string
          created_at: string
          created_by: string | null
          excerpt_en: string | null
          excerpt_ro: string | null
          helpful_count: number
          id: string
          is_published: boolean
          not_helpful_count: number
          slug: string
          sort_order: number
          tags: string[]
          title_en: string | null
          title_ro: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category_group?: string | null
          content_en?: string | null
          content_ro: string
          created_at?: string
          created_by?: string | null
          excerpt_en?: string | null
          excerpt_ro?: string | null
          helpful_count?: number
          id?: string
          is_published?: boolean
          not_helpful_count?: number
          slug: string
          sort_order?: number
          tags?: string[]
          title_en?: string | null
          title_ro: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category_group?: string | null
          content_en?: string | null
          content_ro?: string
          created_at?: string
          created_by?: string | null
          excerpt_en?: string | null
          excerpt_ro?: string | null
          helpful_count?: number
          id?: string
          is_published?: boolean
          not_helpful_count?: number
          slug?: string
          sort_order?: number
          tags?: string[]
          title_en?: string | null
          title_ro?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          conversation_id: string
          created_at: string
          duration_ms: number | null
          height: number | null
          hidden_by_admin: boolean
          id: string
          kind: string
          message_id: string | null
          mime_type: string
          size_bytes: number
          storage_path: string
          thumbnail_path: string | null
          uploader_id: string
          width: number | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          duration_ms?: number | null
          height?: number | null
          hidden_by_admin?: boolean
          id?: string
          kind: string
          message_id?: string | null
          mime_type: string
          size_bytes: number
          storage_path: string
          thumbnail_path?: string | null
          uploader_id: string
          width?: number | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          duration_ms?: number | null
          height?: number | null
          hidden_by_admin?: boolean
          id?: string
          kind?: string
          message_id?: string | null
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          thumbnail_path?: string | null
          uploader_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reports: {
        Row: {
          action_taken: string
          admin_notes: string | null
          attachment_id: string | null
          category: string
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string | null
          public_id: string | null
          reason: string | null
          reported_user_id: string | null
          reporter_id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          action_taken?: string
          admin_notes?: string | null
          attachment_id?: string | null
          category?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          public_id?: string | null
          reason?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          action_taken?: string
          admin_notes?: string | null
          attachment_id?: string | null
          category?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          public_id?: string | null
          reason?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reports_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "message_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          is_hidden: boolean
          is_read: boolean
          message_type: string
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          is_read?: boolean
          message_type?: string
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          is_read?: boolean
          message_type?: string
          sender_id?: string | null
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
      notification_audit_log: {
        Row: {
          channel: string
          created_at: string
          error: string | null
          event_key: string
          id: string
          payload: Json | null
          provider_id: string | null
          rental_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          error?: string | null
          event_key: string
          id?: string
          payload?: Json | null
          provider_id?: string | null
          rental_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string | null
          event_key?: string
          id?: string
          payload?: Json | null
          provider_id?: string | null
          rental_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          email_chat: boolean
          email_marketing: boolean
          email_transactional: boolean
          sms_marketing: boolean
          sms_transactional: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_chat?: boolean
          email_marketing?: boolean
          email_transactional?: boolean
          sms_marketing?: boolean
          sms_transactional?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_chat?: boolean
          email_marketing?: boolean
          email_transactional?: boolean
          sms_marketing?: boolean
          sms_transactional?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          read_at: string | null
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          author_type: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message_text: string
          read_at?: string | null
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          author_type?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message_text?: string
          read_at?: string | null
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
          created_via: string
          description: string
          first_response_at: string | null
          id: string
          last_admin_read_at: string | null
          owner_user_id: string | null
          priority: string
          product_id: string | null
          public_id: string
          rental_user_id: string | null
          requester_user_id: string | null
          reservation_id: string | null
          sla_breached_at: string | null
          sla_due_at: string | null
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
          created_via?: string
          description: string
          first_response_at?: string | null
          id?: string
          last_admin_read_at?: string | null
          owner_user_id?: string | null
          priority?: string
          product_id?: string | null
          public_id?: string
          rental_user_id?: string | null
          requester_user_id?: string | null
          reservation_id?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string | null
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
          created_via?: string
          description?: string
          first_response_at?: string | null
          id?: string
          last_admin_read_at?: string | null
          owner_user_id?: string | null
          priority?: string
          product_id?: string | null
          public_id?: string
          rental_user_id?: string | null
          requester_user_id?: string | null
          reservation_id?: string | null
          sla_breached_at?: string | null
          sla_due_at?: string | null
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
      payout_ibans: {
        Row: {
          account_holder_name: string
          created_at: string
          iban: string
          id: string
          is_default: boolean
          user_id: string
        }
        Insert: {
          account_holder_name: string
          created_at?: string
          iban: string
          id?: string
          is_default?: boolean
          user_id: string
        }
        Update: {
          account_holder_name?: string
          created_at?: string
          iban?: string
          id?: string
          is_default?: boolean
          user_id?: string
        }
        Relationships: []
      }
      phone_otp_verifications: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
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
      product_drafts: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          payload: Json
          product_id: string | null
          step: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          payload?: Json
          product_id?: string | null
          step?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          payload?: Json
          product_id?: string | null
          step?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_drafts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_drafts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          product_id: string
          rating: number
          rating_communication: number | null
          rating_product_condition: number | null
          rating_punctuality: number | null
          rental_id: string | null
          review_type: string
          reviewer_id: string
          status: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          product_id: string
          rating: number
          rating_communication?: number | null
          rating_product_condition?: number | null
          rating_punctuality?: number | null
          rental_id?: string | null
          review_type?: string
          reviewer_id: string
          status?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          product_id?: string
          rating?: number
          rating_communication?: number | null
          rating_product_condition?: number | null
          rating_punctuality?: number | null
          rental_id?: string | null
          review_type?: string
          reviewer_id?: string
          status?: string
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
            foreignKeyName: "product_reviews_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
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
      product_views: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string | null
          visitor_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id?: string | null
          visitor_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string | null
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_edited_at: string | null
          admin_edited_by: string | null
          admin_flagged: boolean
          approval_status: string
          available_from: string | null
          available_immediately: boolean
          blocked_dates: string[]
          category: string | null
          condition: string | null
          created_at: string | null
          created_via: string
          daily_price_owner: number
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          delivery_available: boolean
          delivery_fee: number | null
          delivery_radius_km: number | null
          deposit_type: string | null
          deposit_value: number | null
          description: string | null
          description_en: string | null
          flag_reason: string | null
          id: string
          images: string[] | null
          included_items: string[] | null
          included_items_en: string[] | null
          is_active: boolean
          location_city: string | null
          location_country: string | null
          max_rental_days: number | null
          min_rental_days: number | null
          min_rental_preset: string | null
          owner_id: string
          pending_edits: Json | null
          pending_edits_submitted_at: string | null
          pickup_address: string | null
          pickup_available: boolean
          pickup_lat: number | null
          pickup_lng: number | null
          platform_fee_percent: number
          quality_score: number
          serial_number: string | null
          slug: string | null
          subcategory: string | null
          title: string
          title_en: string | null
          usage_rules: string[]
        }
        Insert: {
          admin_edited_at?: string | null
          admin_edited_by?: string | null
          admin_flagged?: boolean
          approval_status?: string
          available_from?: string | null
          available_immediately?: boolean
          blocked_dates?: string[]
          category?: string | null
          condition?: string | null
          created_at?: string | null
          created_via?: string
          daily_price_owner: number
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          delivery_available?: boolean
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          deposit_type?: string | null
          deposit_value?: number | null
          description?: string | null
          description_en?: string | null
          flag_reason?: string | null
          id?: string
          images?: string[] | null
          included_items?: string[] | null
          included_items_en?: string[] | null
          is_active?: boolean
          location_city?: string | null
          location_country?: string | null
          max_rental_days?: number | null
          min_rental_days?: number | null
          min_rental_preset?: string | null
          owner_id: string
          pending_edits?: Json | null
          pending_edits_submitted_at?: string | null
          pickup_address?: string | null
          pickup_available?: boolean
          pickup_lat?: number | null
          pickup_lng?: number | null
          platform_fee_percent?: number
          quality_score?: number
          serial_number?: string | null
          slug?: string | null
          subcategory?: string | null
          title: string
          title_en?: string | null
          usage_rules?: string[]
        }
        Update: {
          admin_edited_at?: string | null
          admin_edited_by?: string | null
          admin_flagged?: boolean
          approval_status?: string
          available_from?: string | null
          available_immediately?: boolean
          blocked_dates?: string[]
          category?: string | null
          condition?: string | null
          created_at?: string | null
          created_via?: string
          daily_price_owner?: number
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          delivery_available?: boolean
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          deposit_type?: string | null
          deposit_value?: number | null
          description?: string | null
          description_en?: string | null
          flag_reason?: string | null
          id?: string
          images?: string[] | null
          included_items?: string[] | null
          included_items_en?: string[] | null
          is_active?: boolean
          location_city?: string | null
          location_country?: string | null
          max_rental_days?: number | null
          min_rental_days?: number | null
          min_rental_preset?: string | null
          owner_id?: string
          pending_edits?: Json | null
          pending_edits_submitted_at?: string | null
          pickup_address?: string | null
          pickup_available?: boolean
          pickup_lat?: number | null
          pickup_lng?: number | null
          platform_fee_percent?: number
          quality_score?: number
          serial_number?: string | null
          slug?: string | null
          subcategory?: string | null
          title?: string
          title_en?: string | null
          usage_rules?: string[]
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
          account_holder_name: string | null
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
          full_name_locked: boolean
          full_name_source: string | null
          full_name_verified_at: string | null
          iban: string | null
          id: string
          is_banned: boolean
          is_deactivated: boolean
          phone: string | null
          phone_verified: boolean
          reg_com: string | null
          sms_notifications_enabled: boolean
        }
        Insert: {
          account_holder_name?: string | null
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
          full_name_locked?: boolean
          full_name_source?: string | null
          full_name_verified_at?: string | null
          iban?: string | null
          id: string
          is_banned?: boolean
          is_deactivated?: boolean
          phone?: string | null
          phone_verified?: boolean
          reg_com?: string | null
          sms_notifications_enabled?: boolean
        }
        Update: {
          account_holder_name?: string | null
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
          full_name_locked?: boolean
          full_name_source?: string | null
          full_name_verified_at?: string | null
          iban?: string | null
          id?: string
          is_banned?: boolean
          is_deactivated?: boolean
          phone?: string | null
          phone_verified?: boolean
          reg_com?: string | null
          sms_notifications_enabled?: boolean
        }
        Relationships: []
      }
      rental_contract_acceptances: {
        Row: {
          accepted_at: string
          id: string
          rental_id: string
          role: string
          signature_data: string | null
          user_agent: string | null
          user_id: string
          validated_at: string | null
          validation_channel: string | null
          validation_destination: string | null
          validation_ref: string | null
        }
        Insert: {
          accepted_at?: string
          id?: string
          rental_id: string
          role: string
          signature_data?: string | null
          user_agent?: string | null
          user_id: string
          validated_at?: string | null
          validation_channel?: string | null
          validation_destination?: string | null
          validation_ref?: string | null
        }
        Update: {
          accepted_at?: string
          id?: string
          rental_id?: string
          role?: string
          signature_data?: string | null
          user_agent?: string | null
          user_id?: string
          validated_at?: string | null
          validation_channel?: string | null
          validation_destination?: string | null
          validation_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_contract_acceptances_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_contract_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone_masked: string
          ref: string
          rental_id: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone_masked: string
          ref: string
          rental_id: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone_masked?: string
          ref?: string
          rental_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_contract_otps_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_extensions: {
        Row: {
          approved_days: number | null
          approved_end_date: string | null
          created_at: string
          daily_price: number
          decided_at: string | null
          id: string
          note: string | null
          original_end_date: string
          owner_signature_data: string | null
          owner_signed_at: string | null
          paid_at: string | null
          payment_status: string
          platform_fee: number | null
          rejection_reason: string | null
          rental_id: string
          renter_signature_data: string | null
          renter_signed_at: string | null
          requested_by: string
          requested_days: number
          requested_end_date: string
          status: string
          subtotal_amount: number | null
          total_amount: number | null
        }
        Insert: {
          approved_days?: number | null
          approved_end_date?: string | null
          created_at?: string
          daily_price: number
          decided_at?: string | null
          id?: string
          note?: string | null
          original_end_date: string
          owner_signature_data?: string | null
          owner_signed_at?: string | null
          paid_at?: string | null
          payment_status?: string
          platform_fee?: number | null
          rejection_reason?: string | null
          rental_id: string
          renter_signature_data?: string | null
          renter_signed_at?: string | null
          requested_by: string
          requested_days: number
          requested_end_date: string
          status?: string
          subtotal_amount?: number | null
          total_amount?: number | null
        }
        Update: {
          approved_days?: number | null
          approved_end_date?: string | null
          created_at?: string
          daily_price?: number
          decided_at?: string | null
          id?: string
          note?: string | null
          original_end_date?: string
          owner_signature_data?: string | null
          owner_signed_at?: string | null
          paid_at?: string | null
          payment_status?: string
          platform_fee?: number | null
          rejection_reason?: string | null
          rental_id?: string
          renter_signature_data?: string | null
          renter_signed_at?: string | null
          requested_by?: string
          requested_days?: number
          requested_end_date?: string
          status?: string
          subtotal_amount?: number | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_extensions_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_inspections: {
        Row: {
          checklist: Json
          created_at: string
          declaration_accepted: boolean
          id: string
          locked_at: string | null
          metadata: Json | null
          notes: string | null
          phase: string
          photos: string[]
          rental_id: string
          role: string
          user_id: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          declaration_accepted?: boolean
          id?: string
          locked_at?: string | null
          metadata?: Json | null
          notes?: string | null
          phase: string
          photos?: string[]
          rental_id: string
          role: string
          user_id: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          declaration_accepted?: boolean
          id?: string
          locked_at?: string | null
          metadata?: Json | null
          notes?: string | null
          phase?: string
          photos?: string[]
          rental_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_inspections_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_physical_pvs: {
        Row: {
          admin_note: string | null
          created_at: string
          file_name: string
          file_path: string
          id: string
          phase: string
          reason: string
          reason_details: string | null
          rental_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          uploaded_by: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          phase: string
          reason?: string
          reason_details?: string | null
          rental_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          uploaded_by?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          phase?: string
          reason?: string
          reason_details?: string | null
          rental_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_physical_pvs_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_pv_documents: {
        Row: {
          created_at: string
          generated_at: string | null
          id: string
          owner_signature_data: string | null
          owner_signed_at: string | null
          pdf_path: string | null
          phase: string
          photos: string[]
          photos_meta: Json
          rental_id: string
          renter_signature_data: string | null
          renter_signed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          generated_at?: string | null
          id?: string
          owner_signature_data?: string | null
          owner_signed_at?: string | null
          pdf_path?: string | null
          phase: string
          photos?: string[]
          photos_meta?: Json
          rental_id: string
          renter_signature_data?: string | null
          renter_signed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          generated_at?: string | null
          id?: string
          owner_signature_data?: string | null
          owner_signed_at?: string | null
          pdf_path?: string | null
          phase?: string
          photos?: string[]
          photos_meta?: Json
          rental_id?: string
          renter_signature_data?: string | null
          renter_signed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_pv_documents_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_status_history: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          created_at: string
          from_status: string | null
          id: string
          metadata: Json | null
          reason: string | null
          rental_id: string
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          rental_id: string
          to_status: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          rental_id?: string
          to_status?: string
        }
        Relationships: []
      }
      rentals: {
        Row: {
          authorized_at: string | null
          cancel_request_admin_id: string | null
          cancel_request_admin_note: string | null
          cancel_request_created_at: string | null
          cancel_request_initiator: string | null
          cancel_request_reason: string | null
          cancel_request_responded_at: string | null
          cancel_request_response_note: string | null
          cancel_request_status: string | null
          cancel_request_subject: string | null
          cancellation_reason: string | null
          cancellation_tier: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          captured_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          created_via: string
          daily_price: number
          dispute_opened_at: string | null
          dispute_opened_by: string | null
          dispute_phase: string | null
          dispute_reason: string | null
          dispute_status: string
          early_return_decided_at: string | null
          early_return_initiator: string | null
          early_return_new_end_date: string | null
          early_return_new_rental_days: number | null
          early_return_new_subtotal: number | null
          early_return_owner_approved_at: string | null
          early_return_owner_response: string | null
          early_return_reason: string | null
          early_return_refund_amount: number | null
          early_return_renter_approved_at: string | null
          early_return_requested_at: string | null
          early_return_status: string
          end_date: string
          handover_confirmed_at: string | null
          id: string
          insurance_fee: number
          is_test_payment: boolean
          message_to_owner: string | null
          owner_compensation: number | null
          owner_id: string | null
          owner_payout: number
          owner_popup_seen_count: number
          paid_at: string | null
          payment_intent_id: string | null
          payment_method: string | null
          payment_status: string
          pickup_agreed_at: string | null
          pickup_location: string | null
          pickup_proposal: Json | null
          pickup_reminder_sent_at: string | null
          pickup_time: string | null
          platform_fee: number
          platform_fee_percent: number
          product_id: string | null
          product_image_snapshot: string | null
          product_title_snapshot: string | null
          public_id: string
          refund_amount: number | null
          refunded_at: string | null
          rejection_reason: string | null
          rental_days: number
          renter_id: string | null
          renter_seen_confirmation: boolean
          return_confirmed_at: string | null
          start_date: string
          status: string
          stripe_fee: number
          subtotal: number
          updated_at: string | null
          wallet_credit_applied: number
        }
        Insert: {
          authorized_at?: string | null
          cancel_request_admin_id?: string | null
          cancel_request_admin_note?: string | null
          cancel_request_created_at?: string | null
          cancel_request_initiator?: string | null
          cancel_request_reason?: string | null
          cancel_request_responded_at?: string | null
          cancel_request_response_note?: string | null
          cancel_request_status?: string | null
          cancel_request_subject?: string | null
          cancellation_reason?: string | null
          cancellation_tier?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          captured_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_via?: string
          daily_price: number
          dispute_opened_at?: string | null
          dispute_opened_by?: string | null
          dispute_phase?: string | null
          dispute_reason?: string | null
          dispute_status?: string
          early_return_decided_at?: string | null
          early_return_initiator?: string | null
          early_return_new_end_date?: string | null
          early_return_new_rental_days?: number | null
          early_return_new_subtotal?: number | null
          early_return_owner_approved_at?: string | null
          early_return_owner_response?: string | null
          early_return_reason?: string | null
          early_return_refund_amount?: number | null
          early_return_renter_approved_at?: string | null
          early_return_requested_at?: string | null
          early_return_status?: string
          end_date: string
          handover_confirmed_at?: string | null
          id?: string
          insurance_fee?: number
          is_test_payment?: boolean
          message_to_owner?: string | null
          owner_compensation?: number | null
          owner_id?: string | null
          owner_payout: number
          owner_popup_seen_count?: number
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string
          pickup_agreed_at?: string | null
          pickup_location?: string | null
          pickup_proposal?: Json | null
          pickup_reminder_sent_at?: string | null
          pickup_time?: string | null
          platform_fee: number
          platform_fee_percent?: number
          product_id?: string | null
          product_image_snapshot?: string | null
          product_title_snapshot?: string | null
          public_id?: string
          refund_amount?: number | null
          refunded_at?: string | null
          rejection_reason?: string | null
          rental_days: number
          renter_id?: string | null
          renter_seen_confirmation?: boolean
          return_confirmed_at?: string | null
          start_date: string
          status?: string
          stripe_fee?: number
          subtotal: number
          updated_at?: string | null
          wallet_credit_applied?: number
        }
        Update: {
          authorized_at?: string | null
          cancel_request_admin_id?: string | null
          cancel_request_admin_note?: string | null
          cancel_request_created_at?: string | null
          cancel_request_initiator?: string | null
          cancel_request_reason?: string | null
          cancel_request_responded_at?: string | null
          cancel_request_response_note?: string | null
          cancel_request_status?: string | null
          cancel_request_subject?: string | null
          cancellation_reason?: string | null
          cancellation_tier?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          captured_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_via?: string
          daily_price?: number
          dispute_opened_at?: string | null
          dispute_opened_by?: string | null
          dispute_phase?: string | null
          dispute_reason?: string | null
          dispute_status?: string
          early_return_decided_at?: string | null
          early_return_initiator?: string | null
          early_return_new_end_date?: string | null
          early_return_new_rental_days?: number | null
          early_return_new_subtotal?: number | null
          early_return_owner_approved_at?: string | null
          early_return_owner_response?: string | null
          early_return_reason?: string | null
          early_return_refund_amount?: number | null
          early_return_renter_approved_at?: string | null
          early_return_requested_at?: string | null
          early_return_status?: string
          end_date?: string
          handover_confirmed_at?: string | null
          id?: string
          insurance_fee?: number
          is_test_payment?: boolean
          message_to_owner?: string | null
          owner_compensation?: number | null
          owner_id?: string | null
          owner_payout?: number
          owner_popup_seen_count?: number
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string
          pickup_agreed_at?: string | null
          pickup_location?: string | null
          pickup_proposal?: Json | null
          pickup_reminder_sent_at?: string | null
          pickup_time?: string | null
          platform_fee?: number
          platform_fee_percent?: number
          product_id?: string | null
          product_image_snapshot?: string | null
          product_title_snapshot?: string | null
          public_id?: string
          refund_amount?: number | null
          refunded_at?: string | null
          rejection_reason?: string | null
          rental_days?: number
          renter_id?: string | null
          renter_seen_confirmation?: boolean
          return_confirmed_at?: string | null
          start_date?: string
          status?: string
          stripe_fee?: number
          subtotal?: number
          updated_at?: string | null
          wallet_credit_applied?: number
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
      ro_city_coords: {
        Row: {
          city: string
          created_at: string
          id: string
          judet: string
          lat: number
          lng: number
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          judet: string
          lat: number
          lng: number
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          judet?: string
          lat?: number
          lng?: number
        }
        Relationships: []
      }
      secure_action_tokens: {
        Row: {
          created_at: string
          expires_at: string
          purpose: string
          redirect_path: string
          rental_id: string | null
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          purpose: string
          redirect_path: string
          rental_id?: string | null
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          purpose?: string
          redirect_path?: string
          rental_id?: string | null
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string
          message_body: string
          provider_message_id: string | null
          provider_response: Json | null
          recipient_phone: string
          rental_id: string | null
          status: string
          template_key: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key: string
          message_body: string
          provider_message_id?: string | null
          provider_response?: Json | null
          recipient_phone: string
          rental_id?: string | null
          status: string
          template_key: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string
          message_body?: string
          provider_message_id?: string | null
          provider_response?: Json | null
          recipient_phone?: string
          rental_id?: string | null
          status?: string
          template_key?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_csat: {
        Row: {
          comment: string | null
          id: string
          rating: number
          submitted_at: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          id?: string
          rating: number
          submitted_at?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          id?: string
          rating?: number
          submitted_at?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: []
      }
      support_macros: {
        Row: {
          body: string
          category_group: string | null
          created_at: string
          created_by: string | null
          id: string
          title: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          body: string
          category_group?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          body?: string
          category_group?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
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
      url_allowlist: {
        Row: {
          created_at: string
          host: string
          note: string | null
        }
        Insert: {
          created_at?: string
          host: string
          note?: string | null
        }
        Update: {
          created_at?: string
          host?: string
          note?: string | null
        }
        Relationships: []
      }
      url_reports: {
        Row: {
          created_at: string
          host: string | null
          id: string
          message_id: string | null
          reason: string | null
          reporter_id: string
          url: string
        }
        Insert: {
          created_at?: string
          host?: string | null
          id?: string
          message_id?: string | null
          reason?: string | null
          reporter_id: string
          url: string
        }
        Update: {
          created_at?: string
          host?: string | null
          id?: string
          message_id?: string | null
          reason?: string | null
          reporter_id?: string
          url?: string
        }
        Relationships: []
      }
      url_scan_cache: {
        Row: {
          classification: string
          created_at: string
          expires_at: string
          gsb_threat: string | null
          host: string
          normalized_url: string
          reasons: Json
          risk_score: number
          updated_at: string
          url_hash: string
        }
        Insert: {
          classification: string
          created_at?: string
          expires_at?: string
          gsb_threat?: string | null
          host: string
          normalized_url: string
          reasons?: Json
          risk_score?: number
          updated_at?: string
          url_hash: string
        }
        Update: {
          classification?: string
          created_at?: string
          expires_at?: string
          gsb_threat?: string | null
          host?: string
          normalized_url?: string
          reasons?: Json
          risk_score?: number
          updated_at?: string
          url_hash?: string
        }
        Relationships: []
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
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          rating: number
          rental_id: string | null
          reviewed_user_id: string
          reviewer_id: string
          status: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          rating: number
          rental_id?: string | null
          reviewed_user_id: string
          reviewer_id: string
          status?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          rating?: number
          rental_id?: string | null
          reviewed_user_id?: string
          reviewer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
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
      user_warnings: {
        Row: {
          acknowledged_at: string | null
          category: string | null
          created_at: string
          id: string
          issued_by: string | null
          reason: string
          related_report_id: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          category?: string | null
          created_at?: string
          id?: string
          issued_by?: string | null
          reason: string
          related_report_id?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          category?: string | null
          created_at?: string
          id?: string
          issued_by?: string | null
          reason?: string
          related_report_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warnings_related_report_id_fkey"
            columns: ["related_report_id"]
            isOneToOne: false
            referencedRelation: "message_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          metadata: Json | null
          rental_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          metadata?: Json | null
          rental_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json | null
          rental_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_holder: string | null
          admin_note: string | null
          amount: number
          created_at: string
          iban: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          account_holder?: string | null
          admin_note?: string | null
          amount: number
          created_at?: string
          iban: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          account_holder?: string | null
          admin_note?: string | null
          amount?: number
          created_at?: string
          iban?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_rental_contract: {
        Args: { p_rental_id: string; p_user_agent?: string }
        Returns: string
      }
      accept_rental_contract_signed: {
        Args: {
          p_rental_id: string
          p_signature: string
          p_user_agent?: string
        }
        Returns: string
      }
      admin_apply_product_edits: { Args: { _id: string }; Returns: undefined }
      admin_confirm_product_deletion: {
        Args: { _id: string }
        Returns: undefined
      }
      admin_moderate_review: {
        Args: { _approve: boolean; _id: string; _note?: string; _table: string }
        Returns: undefined
      }
      admin_reject_product_deletion: {
        Args: { _id: string }
        Returns: undefined
      }
      admin_reject_product_edits: {
        Args: { _id: string; _reason: string }
        Returns: undefined
      }
      admin_respond_cancellation: {
        Args: { _action: string; _note?: string; _rental_id: string }
        Returns: Json
      }
      auto_confirm_overdue_handovers: {
        Args: never
        Returns: {
          rental_id: string
        }[]
      }
      cancel_product_deletion_request: {
        Args: { _id: string }
        Returns: undefined
      }
      cancel_rental_extension: {
        Args: { _extension_id: string }
        Returns: undefined
      }
      cancel_unpaid_rental: { Args: { _rental_id: string }; Returns: Json }
      claim_chat_notification: {
        Args: {
          _conversation_id: string
          _minutes?: number
          _recipient_id: string
        }
        Returns: boolean
      }
      close_user_ticket: { Args: { p_ticket_id: string }; Returns: undefined }
      complete_rental_extension_card_payment: {
        Args: { _extension_id: string; _session_id: string }
        Returns: boolean
      }
      confirm_handover_received: {
        Args: { _rental_id: string }
        Returns: undefined
      }
      confirm_pickup: { Args: { _rental_id: string }; Returns: Json }
      confirm_rental_handover: { Args: { _rental_id: string }; Returns: string }
      confirm_rental_return: { Args: { _rental_id: string }; Returns: string }
      count_special_chars: { Args: { _t: string }; Returns: number }
      create_user_notification: {
        Args: {
          p_description_en?: string
          p_description_ro?: string
          p_link?: string
          p_title_en: string
          p_title_ro: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      decide_rental_extension: {
        Args: {
          _approved_days: number
          _extension_id: string
          _reason?: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_payout_iban: { Args: { p_id: string }; Returns: undefined }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_slug: { Args: { title: string }; Returns: string }
      get_admin_conversations_list: {
        Args: { search_text?: string }
        Returns: {
          buyer_avatar: string
          buyer_id: string
          buyer_name: string
          created_at: string
          id: string
          last_message_content: string
          last_message_created_at: string
          message_count: number
          owner_avatar: string
          owner_id: string
          owner_name: string
          product_id: string
          product_images: string[]
          product_title: string
          updated_at: string
        }[]
      }
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
      get_admin_notification_summary: {
        Args: never
        Returns: {
          open_tickets: number
          pending_cancellations: number
          pending_products: number
          pending_reports: number
          pending_withdrawals: number
          unread_high_priority: number
          unread_total: number
        }[]
      }
      get_admin_pending_deletions: {
        Args: never
        Returns: {
          approval_status: string
          category: string
          created_at: string
          daily_price_owner: number
          deletion_requested_at: string
          id: string
          images: string[]
          location_city: string
          owner_id: string
          owner_name: string
          slug: string
          title: string
        }[]
      }
      get_admin_pending_products: {
        Args: {
          limit_count?: number
          offset_count?: number
          search_query?: string
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
          included_items: string[]
          is_active: boolean
          location_city: string
          location_country: string
          owner_id: string
          owner_name: string
          pickup_address: string
          slug: string
          subcategory: string
          title: string
        }[]
      }
      get_admin_product_full_details: {
        Args: { _id: string }
        Returns: {
          description: string
          included_items: string[]
          location_country: string
          pickup_address: string
        }[]
      }
      get_admin_products:
        | {
            Args: {
              category_filter?: string
              limit_count?: number
              offset_count?: number
              search_query?: string
              status_filter?: string
            }
            Returns: {
              admin_edited_at: string
              admin_edited_by: string
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
        | {
            Args: {
              category_filter?: string
              created_via_filter?: string
              limit_count?: number
              offset_count?: number
              search_query?: string
              status_filter?: string
            }
            Returns: {
              admin_edited_at: string
              admin_edited_by: string
              admin_flagged: boolean
              approval_status: string
              category: string
              created_at: string
              created_via: string
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
      get_admin_products_sensitive: {
        Args: { _ids: string[] }
        Returns: {
          admin_edited_at: string
          admin_edited_by: string
          admin_flagged: boolean
          flag_reason: string
          id: string
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          serial_number: string
        }[]
      }
      get_admin_rentals:
        | {
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
              public_id: string
              rental_days: number
              renter_id: string
              renter_name: string
              start_date: string
              status: string
              subtotal: number
            }[]
          }
        | {
            Args: {
              created_via_filter?: string
              limit_count?: number
              offset_count?: number
              status_filter?: string
            }
            Returns: {
              category: string
              created_at: string
              created_via: string
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
              public_id: string
              rental_days: number
              renter_id: string
              renter_name: string
              start_date: string
              status: string
              subtotal: number
            }[]
          }
      get_admin_sms_logs: {
        Args: {
          date_from?: string
          date_to?: string
          limit_count?: number
          offset_count?: number
          search_query?: string
          status_filter?: string
        }
        Returns: {
          created_at: string
          error_message: string
          id: string
          idempotency_key: string
          message_body: string
          product_title: string
          provider_message_id: string
          provider_response: Json
          recipient_phone: string
          rental_id: string
          status: string
          template_key: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_admin_stats: {
        Args: never
        Returns: {
          active_rentals: number
          revenue_this_month: number
          total_products: number
          total_rentals: number
          total_users: number
          total_withdrawn: number
        }[]
      }
      get_admin_users: {
        Args: {
          limit_count?: number
          offset_count?: number
          search_query?: string
          status_filter?: string
        }
        Returns: {
          avatar_url: string
          ban_reason: string
          banned_at: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_banned: boolean
          last_warning_at: string
          phone: string
          products_count: number
          rentals_count: number
          total_earned: number
          total_spent: number
          user_role: string
          warnings_count: number
        }[]
      }
      get_booked_dates: {
        Args: { p_product_id: string }
        Returns: {
          end_date: string
          start_date: string
        }[]
      }
      get_chat_signed_media_url: {
        Args: { p_attachment_id: string; p_expires_in?: number }
        Returns: {
          signed_url: string
          thumbnail_url: string
        }[]
      }
      get_contact_info_if_in_conversation: {
        Args: { owner_uuid: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          phone: string
        }[]
      }
      get_homepage_activity: { Args: never; Returns: Json }
      get_homepage_popular_products: {
        Args: { _limit?: number }
        Returns: {
          admin_edited_at: string | null
          admin_edited_by: string | null
          admin_flagged: boolean
          approval_status: string
          available_from: string | null
          available_immediately: boolean
          blocked_dates: string[]
          category: string | null
          condition: string | null
          created_at: string | null
          created_via: string
          daily_price_owner: number
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          delivery_available: boolean
          delivery_fee: number | null
          delivery_radius_km: number | null
          deposit_type: string | null
          deposit_value: number | null
          description: string | null
          description_en: string | null
          flag_reason: string | null
          id: string
          images: string[] | null
          included_items: string[] | null
          included_items_en: string[] | null
          is_active: boolean
          location_city: string | null
          location_country: string | null
          max_rental_days: number | null
          min_rental_days: number | null
          min_rental_preset: string | null
          owner_id: string
          pending_edits: Json | null
          pending_edits_submitted_at: string | null
          pickup_address: string | null
          pickup_available: boolean
          pickup_lat: number | null
          pickup_lng: number | null
          platform_fee_percent: number
          quality_score: number
          serial_number: string | null
          slug: string | null
          subcategory: string | null
          title: string
          title_en: string | null
          usage_rules: string[]
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_product_serial: { Args: { _id: string }; Returns: string }
      get_my_products_sensitive: {
        Args: never
        Returns: {
          id: string
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          serial_number: string
        }[]
      }
      get_or_create_rental_conversation: {
        Args: { p_rental_id: string }
        Returns: string
      }
      get_owner_listings_stats: { Args: { p_owner: string }; Returns: Json }
      get_owner_rentals: {
        Args: { owner_uuid: string }
        Returns: {
          created_at: string
          daily_price: number
          dispute_status: string
          end_date: string
          handover_confirmed_at: string
          id: string
          message_to_owner: string
          owner_payout: number
          payment_method: string
          payment_status: string
          pickup_agreed_at: string
          platform_fee: number
          product_id: string
          product_image: string
          product_title: string
          public_id: string
          refunded_at: string
          rejection_reason: string
          rental_days: number
          renter_avatar: string
          renter_id: string
          renter_name: string
          return_confirmed_at: string
          start_date: string
          status: string
          subtotal: number
        }[]
      }
      get_product_deletion_status: {
        Args: { _slug: string }
        Returns: {
          deleted: boolean
          exists_flag: boolean
        }[]
      }
      get_product_deletion_status_by_id: {
        Args: { _id: string }
        Returns: {
          deleted: boolean
          exists_flag: boolean
          slug: string
        }[]
      }
      get_product_extended_stats: {
        Args: { p_product_id: string }
        Returns: Json
      }
      get_product_owner_public_info: {
        Args: { owner_uuid: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_product_review_breakdown: {
        Args: { p_product_id: string }
        Returns: Json
      }
      get_product_sensitive_fields: {
        Args: { _id: string }
        Returns: {
          admin_edited_at: string
          admin_edited_by: string
          admin_flagged: boolean
          flag_reason: string
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          serial_number: string
        }[]
      }
      get_products_map_points: {
        Args: { _ids: string[] }
        Returns: {
          approx_lat: number
          approx_lng: number
          has_precise: boolean
          id: string
        }[]
      }
      get_rental_by_public_id: {
        Args: { p_public_id: string }
        Returns: {
          created_at: string
          end_date: string
          id: string
          owner_id: string
          owner_name: string
          payment_status: string
          product_id: string
          product_title: string
          public_id: string
          rental_days: number
          renter_id: string
          renter_name: string
          start_date: string
          status: string
          subtotal: number
        }[]
      }
      get_rental_details: {
        Args: { rental_uuid: string }
        Returns: {
          end_date: string
          id: string
          owner_id: string
          owner_name: string
          owner_payout: number
          payment_status: string
          product_id: string
          product_images: string[]
          product_title: string
          rental_days: number
          renter_id: string
          renter_name: string
          start_date: string
          status: string
          subtotal: number
        }[]
      }
      get_rental_full_detail: {
        Args: { _public_id: string }
        Returns: {
          cancelled_at: string
          completed_at: string
          created_at: string
          daily_price: number
          dispute_status: string
          early_return_status: string
          end_date: string
          handover_confirmed_at: string
          handover_pv_generated_at: string
          handover_pv_owner_signed_at: string
          handover_pv_renter_signed_at: string
          id: string
          is_test_payment: boolean
          owner_email: string
          owner_id: string
          owner_name: string
          owner_payout: number
          owner_phone: string
          payment_status: string
          pickup_location: string
          pickup_time: string
          platform_fee: number
          product_category: string
          product_deposit_value: number
          product_id: string
          product_image: string
          product_included_items: string[]
          product_location_city: string
          product_title: string
          public_id: string
          rejection_reason: string
          rental_days: number
          renter_email: string
          renter_id: string
          renter_name: string
          renter_phone: string
          return_confirmed_at: string
          return_pv_generated_at: string
          return_pv_owner_signed_at: string
          return_pv_renter_signed_at: string
          start_date: string
          status: string
          subtotal: number
        }[]
      }
      get_rental_popup_by_id: {
        Args: { _rental_id: string }
        Returns: {
          category_slug: string
          confirmed_at: string
          counterparty_avatar: string
          counterparty_id: string
          counterparty_name: string
          created_at: string
          end_date: string
          id: string
          message_to_owner: string
          mode: string
          outcome: string
          product_id: string
          product_image: string
          product_slug: string
          product_title: string
          public_id: string
          rental_days: number
          start_date: string
          status: string
          subtotal: number
        }[]
      }
      get_rental_popups: {
        Args: never
        Returns: {
          category_slug: string
          confirmed_at: string
          counterparty_avatar: string
          counterparty_id: string
          counterparty_name: string
          created_at: string
          end_date: string
          id: string
          message_to_owner: string
          mode: string
          outcome: string
          product_id: string
          product_image: string
          product_slug: string
          product_title: string
          public_id: string
          rental_days: number
          start_date: string
          status: string
          subtotal: number
        }[]
      }
      get_rental_pv_signed_url: {
        Args: { _phase: string; _rental_id: string }
        Returns: string
      }
      get_rental_renter_info: {
        Args: { renter_ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_similar_pricing: {
        Args: { p_category: string; p_subcategory?: string }
        Returns: {
          p25: number
          p50: number
          p75: number
          sample_size: number
        }[]
      }
      get_support_analytics: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
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
          rental_days: number
          rental_end_date: string
          rental_start_date: string
          rentals_id: string
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
      get_user_health_score: { Args: { p_user_id: string }; Returns: Json }
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
      get_user_wallet_balance: {
        Args: { _user_id: string }
        Returns: {
          available: number
          pending_earnings: number
          pending_withdrawals: number
          total_earnings: number
          total_withdrawn: number
          wallet_spent: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      increment_macro_usage: {
        Args: { p_macro_id: string }
        Returns: undefined
      }
      increment_owner_popup_seen: {
        Args: { _rental_id: string }
        Returns: number
      }
      initiate_return: { Args: { _rental_id: string }; Returns: undefined }
      invoke_edge_function_async: {
        Args: { _body?: Json; _fn_name: string }
        Returns: undefined
      }
      is_user_banned: { Args: { _user_id: string }; Returns: boolean }
      is_user_favorite: { Args: { target_user_id: string }; Returns: boolean }
      kb_record_view: { Args: { p_slug: string }; Returns: undefined }
      kb_search: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          category_group: string
          excerpt_en: string
          excerpt_ro: string
          id: string
          similarity: number
          slug: string
          title_en: string
          title_ro: string
        }[]
      }
      kb_vote: {
        Args: { p_article_id: string; p_helpful: boolean }
        Returns: undefined
      }
      list_pending_cancellation_requests: {
        Args: never
        Returns: {
          cancel_request_created_at: string
          cancel_request_reason: string
          cancel_request_subject: string
          end_date: string
          initiator_id: string
          initiator_role: string
          owner_email: string
          owner_id: string
          owner_name: string
          payment_status: string
          platform_fee: number
          product_id: string
          product_image: string
          product_title: string
          rental_id: string
          rental_public_id: string
          renter_email: string
          renter_id: string
          renter_name: string
          start_date: string
          status: string
          subtotal: number
          total_days: number
        }[]
      }
      list_resolved_cancellation_requests: {
        Args: never
        Returns: {
          cancel_request_admin_id: string
          cancel_request_admin_note: string
          cancel_request_created_at: string
          cancel_request_reason: string
          cancel_request_responded_at: string
          cancel_request_response_note: string
          cancel_request_status: string
          cancel_request_subject: string
          end_date: string
          initiator_id: string
          initiator_role: string
          owner_email: string
          owner_id: string
          owner_name: string
          payment_status: string
          platform_fee: number
          product_id: string
          product_image: string
          product_title: string
          rental_id: string
          rental_public_id: string
          renter_email: string
          renter_id: string
          renter_name: string
          start_date: string
          status: string
          subtotal: number
          total_days: number
        }[]
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      mark_ops_ticket_read: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      mark_renter_confirmation_seen: {
        Args: { _rental_id: string }
        Returns: undefined
      }
      mark_ticket_messages_read: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_for_profanity: { Args: { input: string }; Returns: string }
      normalize_full_name: { Args: { input_name: string }; Returns: string }
      notify_rental_event_async: {
        Args: {
          _actor_id?: string
          _event_key: string
          _extra?: Json
          _rental_id: string
        }
        Returns: undefined
      }
      open_rental_dispute: {
        Args: { _phase: string; _reason: string; _rental_id: string }
        Returns: undefined
      }
      pay_rental_extension_with_wallet: {
        Args: { _extension_id: string }
        Returns: undefined
      }
      pay_rental_with_wallet: { Args: { _rental_id: string }; Returns: Json }
      pick_admin_for_ticket_category: {
        Args: { p_group: string }
        Returns: string
      }
      post_rental_timeline_chat_event: {
        Args: { _kind: string; _rental_id: string }
        Returns: undefined
      }
      propose_pickup: {
        Args: {
          _pickup_place: string
          _pickup_time: string
          _rental_id: string
        }
        Returns: Json
      }
      purge_expired_deleted_products: { Args: never; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      renter_cancel_unpaid_rental: {
        Args: { _rental_id: string }
        Returns: Json
      }
      request_mutual_cancellation: {
        Args: { _reason: string; _rental_id: string; _subject: string }
        Returns: Json
      }
      request_product_deletion: { Args: { _id: string }; Returns: undefined }
      request_rental_extension: {
        Args: { _days: number; _note?: string; _rental_id: string }
        Returns: string
      }
      resolve_rental_dispute: {
        Args: { _rental_id: string }
        Returns: undefined
      }
      respond_mutual_cancellation: {
        Args: { _action: string; _note?: string; _rental_id: string }
        Returns: Json
      }
      review_contains_contact: { Args: { _t: string }; Returns: boolean }
      search_products: {
        Args: {
          _category?: string
          _location_city?: string
          _search?: string
          _search_terms?: string[]
          _subcategory?: string
        }
        Returns: {
          approval_status: string
          available_from: string
          available_immediately: boolean
          blocked_dates: string[]
          category: string
          condition: string
          created_at: string
          daily_price_owner: number
          delivery_available: boolean
          delivery_fee: number
          delivery_radius_km: number
          deposit_type: string
          deposit_value: number
          description: string
          description_en: string
          id: string
          images: string[]
          included_items: string[]
          included_items_en: string[]
          is_active: boolean
          location_city: string
          location_country: string
          max_rental_days: number
          min_rental_days: number
          min_rental_preset: string
          owner_id: string
          pickup_available: boolean
          platform_fee_percent: number
          quality_score: number
          slug: string
          subcategory: string
          title: string
          title_en: string
          usage_rules: string[]
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sign_rental_extension: {
        Args: { _extension_id: string; _signature: string }
        Returns: boolean
      }
      soft_delete_my_product: { Args: { _id: string }; Returns: undefined }
      text_has_profanity: { Args: { input: string }; Returns: boolean }
      track_product_view: {
        Args: { p_product_id: string; p_visitor_hash: string }
        Returns: undefined
      }
      unaccent: { Args: { "": string }; Returns: string }
      verify_and_sign_rental_contract: {
        Args: {
          p_code: string
          p_rental_id: string
          p_signature: string
          p_user_agent?: string
        }
        Returns: Json
      }
      withdraw_cancellation_request: {
        Args: { _rental_id: string }
        Returns: Json
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
