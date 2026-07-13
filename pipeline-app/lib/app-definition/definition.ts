import type { AppDefinition } from "@/lib/app-definition/types";export const appDefinition: AppDefinition = {
  "runtimeKind": "custom_app",
  "app": {
    "id": "75f37c030c1f",
    "name": "BioBridge Pipeline",
    "description": "BioBridge Pipeline custom App upgraded from an existing database App.",
    "version": "1.0.0",
    "baseUrl": "https://biobridge-pipeline.kylon.app"
  },
  "entities": [
    {
      "id": "leads",
      "label": "Lead",
      "pluralLabel": "Leads",
      "description": "Leads records.",
      "titleField": "org_name",
      "table": "leads",
      "idColumn": "id",
      "createdAtColumn": "created_at",
      "updatedAtColumn": "updated_at",
      "fields": [
        {
          "key": "org_name",
          "column": "org_name",
          "label": "Organization",
          "type": "text",
          "required": true
        },
        {
          "key": "org_type",
          "column": "org_type",
          "label": "Type",
          "type": "select",
          "config": {
            "options": [
              {
                "id": "cro",
                "color": "blue",
                "label": "CRO"
              },
              {
                "id": "academic",
                "color": "green",
                "label": "Academic lab"
              },
              {
                "id": "biotech",
                "color": "purple",
                "label": "Biotech"
              },
              {
                "id": "core_facility",
                "color": "teal",
                "label": "Core facility"
              },
              {
                "id": "institute",
                "color": "indigo",
                "label": "Research institute"
              }
            ]
          }
        },
        {
          "key": "country",
          "column": "country",
          "label": "Country",
          "type": "text"
        },
        {
          "key": "city",
          "column": "city",
          "label": "City",
          "type": "text"
        },
        {
          "key": "website",
          "column": "website",
          "label": "Website",
          "type": "url"
        },
        {
          "key": "capabilities",
          "column": "capabilities",
          "label": "Capabilities",
          "type": "text"
        },
        {
          "key": "protocol_match",
          "column": "protocol_match",
          "label": "Protocol match",
          "type": "select",
          "config": {
            "options": [
              {
                "id": "strong",
                "color": "green",
                "label": "Strong"
              },
              {
                "id": "partial",
                "color": "yellow",
                "label": "Partial"
              },
              {
                "id": "weak",
                "color": "rose",
                "label": "Weak"
              }
            ]
          }
        },
        {
          "key": "regulatory_status",
          "column": "regulatory_status",
          "label": "Regulatory fit",
          "type": "select",
          "config": {
            "options": [
              {
                "id": "permitted",
                "color": "green",
                "label": "Permitted"
              },
              {
                "id": "restricted",
                "color": "yellow",
                "label": "Restricted"
              },
              {
                "id": "prohibited",
                "color": "rose",
                "label": "Prohibited"
              },
              {
                "id": "unknown",
                "color": "gray",
                "label": "Unknown"
              }
            ]
          }
        },
        {
          "key": "regulatory_notes",
          "column": "regulatory_notes",
          "label": "Regulatory notes",
          "type": "text"
        },
        {
          "key": "fit_score",
          "column": "fit_score",
          "label": "Fit score",
          "type": "number"
        },
        {
          "key": "stage",
          "column": "stage",
          "label": "Stage",
          "type": "select",
          "config": {
            "options": [
              {
                "id": "discovered",
                "color": "gray",
                "label": "Discovered"
              },
              {
                "id": "researched",
                "color": "cyan",
                "label": "Researched"
              },
              {
                "id": "qualified",
                "color": "blue",
                "label": "Qualified"
              },
              {
                "id": "drafted",
                "color": "indigo",
                "label": "Outreach drafted"
              },
              {
                "id": "sent",
                "color": "green",
                "label": "Sent"
              },
              {
                "id": "replied",
                "color": "pink",
                "label": "Replied"
              },
              {
                "id": "disqualified",
                "color": "rose",
                "label": "Disqualified"
              }
            ]
          }
        },
        {
          "key": "contact_name",
          "column": "contact_name",
          "label": "Contact",
          "type": "text"
        },
        {
          "key": "contact_title",
          "column": "contact_title",
          "label": "Contact title",
          "type": "text"
        },
        {
          "key": "contact_email",
          "column": "contact_email",
          "label": "Contact email",
          "type": "email"
        },
        {
          "key": "outreach_draft",
          "column": "outreach_draft",
          "label": "Outreach draft",
          "type": "text"
        },
        {
          "key": "research_summary",
          "column": "research_summary",
          "label": "Research summary",
          "type": "text"
        },
        {
          "key": "source_url",
          "column": "source_url",
          "label": "Source",
          "type": "url"
        },
        {
          "key": "created_at",
          "column": "created_at",
          "label": "Created",
          "type": "date",
          "system": true,
          "config": {
            "include_time": true
          }
        },
        {
          "key": "updated_at",
          "column": "updated_at",
          "label": "Updated",
          "type": "date",
          "system": true,
          "config": {
            "include_time": true
          }
        }
      ],
      "relationships": []
    }
  ]
};
