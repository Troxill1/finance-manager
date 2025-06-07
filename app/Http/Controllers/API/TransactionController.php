<?php

namespace App\Http\Controllers\API;

use App\Models\Transaction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TransactionController extends Controller
{
    public function index()
    {
        return Auth::user()->transactions()->with('category')->latest()->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric',
            'description' => 'nullable|string',
            'transaction_date' => 'required|date',
        ]);

        return Auth::user()->transactions()->create($data);
    }

    public function destroy($id)
    {
        $transaction = Auth::user()->transactions()->findOrFail($id);
        $transaction->delete();

        return response()->json(['message' => 'Transaction deleted']);
    }
}
