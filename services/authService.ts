import { supabase } from "@/lib/supabase";

interface AuthResponse {
    data: object | null;
    error: Error | null;
}

export const signInWithGoogle = async () => {
    const { data, error }: AuthResponse = await supabase.auth.signInWithOAuth({
        provider: 'google',
    });

    if (error) {
        console.error('Login error:', error);
    } else {
        console.log('User logged in:', data);
    }
};

export const registerWithEmail = async (name: string, email: string, password: string): Promise<void> => {
    console.log(name, email, password);
    const { data, error }: AuthResponse = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { display_name: name }
        }
    });

    if (error) {
        console.error("Registrasi gagal:", error.message);
    } else {
        console.log("Registrasi berhasil:", data);
    }
};

export const loginWithEmail = async (email: string, password: string): Promise<void> => {
    const { data, error }: AuthResponse = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error("Login gagal:", error.message);
    } else {
        console.log("Login berhasil:", data);
    }
};