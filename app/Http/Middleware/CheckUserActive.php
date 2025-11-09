<?php
// filepath: app/Http/Middleware/CheckUserActive.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && !Auth::user()->is_active) {
            // Log activity for audit trail (per Copilot instructions - Common Integration Point #5)
            activity()
                ->causedBy(Auth::user())
                ->withProperties([
                    'user_id' => Auth::user()->user_id,
                    'email' => Auth::user()->email,
                    'reason' => 'account_deactivated_during_session'
                ])
                ->log('Session terminated - account deactivated');

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->with('error', 'Your account has been deactivated. Please contact the administrator.');
        }

        return $next($request);
    }
}