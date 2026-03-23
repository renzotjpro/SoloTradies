"""
Search tools for the LangGraph agent.

Uses a factory pattern: make_search_tools(sb, owner_id) returns a list of
@tool-decorated functions with the Supabase client and owner_id captured
in closure. This lets the LLM decide which tool(s) to call.
"""

import logging
import re
from typing import Optional

from langchain_core.tools import tool

from app.crud import crud
from app.memory import MemoryProvider

logger = logging.getLogger(__name__)


def make_search_tools(sb, owner_id: str) -> list:
    """Factory that returns bound search tools for the given user."""

    # ------------------------------------------------------------------
    # Tool 1: search_clients
    # ------------------------------------------------------------------
    @tool
    def search_clients(query: str, search_by: str = "name") -> dict:
        """Search for clients by name, email, company, ABN, or state.
        Use search_by to specify the field: 'name' (default), 'email', 'company', 'abn', 'state'.
        Returns matching clients with contact details."""
        try:
            results = crud.search_clients(sb, owner_id, query, search_by)
            if results:
                return {
                    "found": True,
                    "count": len(results),
                    "clients": [
                        {
                            "id": c["id"],
                            "name": c.get("name"),
                            "email": c.get("email"),
                            "company": c.get("company"),
                            "phone": c.get("phone"),
                            "abn": c.get("abn"),
                            "address": c.get("address"),
                            "state": c.get("state"),
                            "notes": c.get("notes"),
                        }
                        for c in results
                    ],
                }

            # Fuzzy fallback: broaden to first 3 chars of query
            fuzzy = []
            if len(query) > 3 and search_by == "name":
                fuzzy_results = crud.search_clients(sb, owner_id, query[:3], "name")
                fuzzy = [{"name": c["name"], "company": c.get("company")} for c in fuzzy_results[:5]]

            # Get recent clients for context
            recent = crud.get_clients(sb, owner_id, skip=0, limit=5)
            recent_list = [{"name": c["name"], "company": c.get("company")} for c in recent]

            return {
                "found": False,
                "count": 0,
                "query": query,
                "search_by": search_by,
                "near_matches": fuzzy,
                "recent_clients": recent_list,
            }
        except Exception as e:
            logger.error(f"search_clients tool error: {e}")
            return {"found": False, "count": 0, "error": "Search failed, please try again."}

    # ------------------------------------------------------------------
    # Tool 2: search_invoices
    # ------------------------------------------------------------------
    @tool
    def search_invoices(
        invoice_number: Optional[str] = None,
        client_name: Optional[str] = None,
        status: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
    ) -> dict:
        """Search invoices by number, client name, status (paid/unpaid/overdue/draft/sent),
        date range (YYYY-MM-DD), or amount range. Returns invoice details with client info and line items."""
        try:
            # Resolve client_name to client_id if provided
            client_id = None
            if client_name:
                clients = crud.search_clients(sb, owner_id, client_name, "name")
                if clients:
                    client_id = clients[0]["id"]
                else:
                    return {
                        "found": False,
                        "count": 0,
                        "message": f"No client found matching '{client_name}'.",
                        "suggestion": "Try searching for the client first to verify the name.",
                    }

            results = crud.search_invoices(
                sb, owner_id,
                invoice_number=invoice_number,
                client_id=client_id,
                status=status,
                date_from=date_from,
                date_to=date_to,
                min_amount=min_amount,
                max_amount=max_amount,
            )

            if results:
                invoices = []
                for inv in results:
                    client = inv.get("client") or {}
                    items = inv.get("items") or []
                    invoices.append({
                        "id": inv["id"],
                        "invoice_number": inv.get("invoice_number"),
                        "client_name": client.get("name"),
                        "client_company": client.get("company"),
                        "issue_date": inv.get("issue_date"),
                        "due_date": inv.get("due_date"),
                        "status": inv.get("status"),
                        "subtotal": inv.get("subtotal"),
                        "tax_amount": inv.get("tax_amount"),
                        "total_amount": inv.get("total_amount"),
                        "notes": inv.get("notes"),
                        "items": [
                            {
                                "description": it.get("description"),
                                "quantity": it.get("quantity"),
                                "unit_price": it.get("unit_price"),
                                "amount": it.get("amount"),
                            }
                            for it in items
                        ],
                    })

                total_sum = sum(inv.get("total_amount") or 0 for inv in results)
                return {
                    "found": True,
                    "count": len(invoices),
                    "total_sum": round(total_sum, 2),
                    "invoices": invoices,
                }

            # Fallback: show recent invoices
            recent = crud.search_invoices(sb, owner_id)
            recent_list = [
                {
                    "invoice_number": inv.get("invoice_number"),
                    "client_name": (inv.get("client") or {}).get("name"),
                    "total_amount": inv.get("total_amount"),
                    "status": inv.get("status"),
                }
                for inv in (recent or [])[:5]
            ]
            return {
                "found": False,
                "count": 0,
                "recent_invoices": recent_list,
            }
        except Exception as e:
            logger.error(f"search_invoices tool error: {e}")
            return {"found": False, "count": 0, "error": "Invoice search failed."}

    # ------------------------------------------------------------------
    # Tool 3: search_expenses
    # ------------------------------------------------------------------
    @tool
    def search_expenses(
        category: Optional[str] = None,
        client_name: Optional[str] = None,
        invoice_number: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        description: Optional[str] = None,
        missing_receipt: bool = False,
    ) -> dict:
        """Search expenses by category, client name, linked invoice number,
        date range (YYYY-MM-DD), description keyword, or missing receipt flag."""
        try:
            # Resolve client_name to client_id
            client_id = None
            if client_name:
                clients = crud.search_clients(sb, owner_id, client_name, "name")
                if clients:
                    client_id = clients[0]["id"]

            # Resolve invoice_number to invoice_id
            invoice_id = None
            if invoice_number:
                invs = crud.search_invoices(sb, owner_id, invoice_number=invoice_number)
                if invs:
                    invoice_id = invs[0]["id"]

            results = crud.search_expenses(
                sb, owner_id,
                category=category,
                client_id=client_id,
                invoice_id=invoice_id,
                date_from=date_from,
                date_to=date_to,
                description=description,
                missing_receipt=missing_receipt,
            )

            if results:
                total = sum(r["amount"] or 0 for r in results)
                total_gst = sum(r["gst_included"] or 0 for r in results)
                expenses = [
                    {
                        "id": e["id"],
                        "description": e.get("description"),
                        "amount": e.get("amount"),
                        "gst_included": e.get("gst_included"),
                        "category": e.get("category"),
                        "expense_date": e.get("expense_date"),
                        "has_receipt": bool(e.get("receipt_url")),
                    }
                    for e in results
                ]
                return {
                    "found": True,
                    "count": len(expenses),
                    "total_amount": round(total, 2),
                    "total_gst": round(total_gst, 2),
                    "expenses": expenses,
                }

            return {
                "found": False,
                "count": 0,
                "message": "No expenses found matching your criteria.",
            }
        except Exception as e:
            logger.error(f"search_expenses tool error: {e}")
            return {"found": False, "count": 0, "error": "Expense search failed."}

    # ------------------------------------------------------------------
    # Tool 4: get_business_profile
    # ------------------------------------------------------------------
    @tool
    def get_business_profile() -> dict:
        """Retrieve the user's own business profile: ABN, business name, address, phone, email.
        Checks organizations table first, falls back to profiles table."""
        try:
            org = crud.get_organization(sb, owner_id)
            if org:
                return {
                    "found": True,
                    "source": "organizations",
                    "name": org.get("name"),
                    "abn": org.get("abn"),
                    "phone": org.get("phone"),
                    "email": org.get("email"),
                    "industry": org.get("industry"),
                    "address_line1": org.get("address_line1"),
                    "city": org.get("city"),
                    "state": org.get("state"),
                    "postcode": org.get("postcode"),
                    "country": org.get("country"),
                }

            # Fallback to profiles table
            profile_result = (
                sb.table("profiles")
                .select("*")
                .eq("id", owner_id)
                .execute()
            )
            if profile_result.data:
                p = profile_result.data[0]
                return {
                    "found": True,
                    "source": "profiles",
                    "full_name": p.get("full_name"),
                    "business_name": p.get("business_name"),
                    "abn": p.get("abn"),
                }

            return {
                "found": False,
                "message": "No business profile set up yet. The user should set up their business details.",
            }
        except Exception as e:
            logger.error(f"get_business_profile tool error: {e}")
            return {"found": False, "error": "Could not retrieve business profile."}

    # ------------------------------------------------------------------
    # Tool 5: get_financial_summary
    # ------------------------------------------------------------------
    @tool
    def get_financial_summary(metric: str = "overview") -> dict:
        """Get financial dashboard summary. metric options:
        'overview' - total invoices, outstanding, paid this month, upcoming.
        'cashflow' - monthly revenue trend (last 6 months).
        'invoice_status' - totals by status (Draft, Sent, Paid, Overdue).
        'full' - all of the above combined."""
        try:
            result = {}
            if metric in ("overview", "full"):
                stats = crud.get_overview_stats(sb, owner_id)
                result["overview"] = {
                    "total_invoices": stats.total_invoices,
                    "outstanding_amount": stats.outstanding_amount,
                    "paid_this_month": stats.paid_this_month,
                    "upcoming_payments": stats.upcoming_payments,
                }
            if metric in ("cashflow", "full"):
                cashflow = crud.get_cashflow_summary(sb, owner_id)
                result["cashflow"] = [{"month": c.month, "amount": c.amount} for c in cashflow]
            if metric in ("invoice_status", "full"):
                status_data = crud.get_invoice_status_summary(sb, owner_id)
                result["invoice_status"] = [{"status": s.status, "amount": s.amount} for s in status_data]

            if not result:
                result["overview"] = "Invalid metric. Use 'overview', 'cashflow', 'invoice_status', or 'full'."

            return {"found": True, **result}
        except Exception as e:
            logger.error(f"get_financial_summary tool error: {e}")
            return {"found": False, "error": "Could not retrieve financial summary."}

    # ------------------------------------------------------------------
    # Tool 6: search_user_memories
    # ------------------------------------------------------------------
    @tool
    def search_user_memories(query: str, category: Optional[str] = None) -> dict:
        """Search the user's stored memories for pricing history, preferences, or behavioral notes.
        category options: 'client_pricing', 'preference', 'behavioral', or None for all."""
        try:
            provider = MemoryProvider(sb, owner_id)
            results = provider.retrieve_relevant(query=query, limit=10)

            if category:
                results = [r for r in results if r.get("category") == category]

            if results:
                memories = [
                    {
                        "category": m.get("category"),
                        "subject": m.get("subject"),
                        "key": m.get("key"),
                        "value": m.get("value"),
                    }
                    for m in results
                ]
                return {"found": True, "count": len(memories), "memories": memories}

            return {"found": False, "count": 0, "message": "No memories found for that query."}
        except Exception as e:
            logger.error(f"search_user_memories tool error: {e}")
            return {"found": False, "count": 0, "error": "Memory search failed."}

    # ------------------------------------------------------------------
    # Tool 7: get_branding_settings
    # ------------------------------------------------------------------
    @tool
    def get_branding_settings() -> dict:
        """Retrieve the user's invoice branding settings: template, colors, fonts, logos,
        visibility toggles, payment terms, and custom labels."""
        try:
            branding = crud.get_branding_with_labels(sb, owner_id)
            if branding and (branding.get("id") or branding.get("template_id")):
                return {
                    "found": True,
                    "template_id": branding.get("template_id"),
                    "header_layout": branding.get("header_layout"),
                    "colour_graphical": branding.get("colour_graphical"),
                    "colour_text": branding.get("colour_text"),
                    "font_family": branding.get("font_family"),
                    "font_size": branding.get("font_size"),
                    "logo_url": branding.get("logo_url"),
                    "logo_position": branding.get("logo_position"),
                    "payment_terms": branding.get("payment_terms"),
                    "payment_details": branding.get("payment_details"),
                    "footer_message": branding.get("footer_message"),
                    "terms_conditions": branding.get("terms_conditions"),
                    "labels": branding.get("labels", {}),
                }
            return {
                "found": False,
                "message": "No branding settings configured yet. Using defaults.",
                "labels": branding.get("labels", {}) if branding else {},
            }
        except Exception as e:
            logger.error(f"get_branding_settings tool error: {e}")
            return {"found": False, "error": "Could not retrieve branding settings."}

    # ------------------------------------------------------------------
    # Tool 8: search_conversations
    # ------------------------------------------------------------------
    @tool
    def search_conversations(query: Optional[str] = None, limit: int = 5) -> dict:
        """Search past conversations by keyword in title/summary, or return the most recent ones.
        Leave query empty to get the latest conversations."""
        try:
            results = crud.search_conversations_by_query(sb, owner_id, query_text=query, limit=limit)
            if results:
                convos = [
                    {
                        "id": c["id"],
                        "title": c.get("title"),
                        "summary": c.get("summary"),
                        "updated_at": c.get("updated_at"),
                    }
                    for c in results
                ]
                return {"found": True, "count": len(convos), "conversations": convos}

            return {"found": False, "count": 0, "message": "No matching conversations found."}
        except Exception as e:
            logger.error(f"search_conversations tool error: {e}")
            return {"found": False, "count": 0, "error": "Conversation search failed."}

    # ------------------------------------------------------------------
    # Tool 9: get_revenue_by_client
    # ------------------------------------------------------------------
    @tool
    def get_revenue_by_client(
        client_name: str,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> dict:
        """Get revenue breakdown for a specific client: total billed, paid, outstanding, invoice count.
        Optionally filter by date range (YYYY-MM-DD)."""
        try:
            # Resolve client name
            clients = crud.search_clients(sb, owner_id, client_name, "name")
            if not clients:
                return {
                    "found": False,
                    "message": f"No client found matching '{client_name}'.",
                }

            client = clients[0]
            revenue = crud.get_client_revenue(
                sb, owner_id, client["id"],
                date_from=date_from, date_to=date_to,
            )
            return {
                "found": True,
                "client_name": client["name"],
                "client_company": client.get("company"),
                **revenue,
            }
        except Exception as e:
            logger.error(f"get_revenue_by_client tool error: {e}")
            return {"found": False, "error": "Revenue lookup failed."}

    # ------------------------------------------------------------------
    # Tool 10: get_gst_summary
    # ------------------------------------------------------------------
    @tool
    def get_gst_summary(date_from: str, date_to: str) -> dict:
        """Get GST summary for BAS preparation: GST collected (from invoices) vs GST paid (on expenses).
        Requires date range in YYYY-MM-DD format (e.g. '2026-01-01' to '2026-03-31' for Q1)."""
        try:
            summary = crud.get_gst_summary(sb, owner_id, date_from, date_to)
            return {"found": True, **summary}
        except Exception as e:
            logger.error(f"get_gst_summary tool error: {e}")
            return {"found": False, "error": "GST summary failed."}

    # ------------------------------------------------------------------
    # Return all tools
    # ------------------------------------------------------------------
    return [
        search_clients,
        search_invoices,
        search_expenses,
        get_business_profile,
        get_financial_summary,
        search_user_memories,
        get_branding_settings,
        search_conversations,
        get_revenue_by_client,
        get_gst_summary,
    ]
