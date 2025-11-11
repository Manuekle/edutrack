'use server';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';

export async function uploadSignature(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return { success: false, message: 'Unauthorized.' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, message: 'No file provided.' };
  }

  if (!file.type.startsWith('image/')) {
    return { success: false, message: 'File must be an image.' };
  }

  const userId = session.user.id;
  const filename = `signatures/signature-${userId}-${Date.now()}-${file.name}`;

  try {
    // Get current user to check for existing signature
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { signatureUrl: true },
    });

    // Upload the new signature
    const blob = await put(filename, file, {
      access: 'public',
    });

    // Update user with new signature URL
    await prisma.user.update({
      where: { id: userId },
      data: { signatureUrl: blob.url },
    });

    // Delete old signature if it exists
    if (currentUser?.signatureUrl) {
      try {
        const oldSignatureUrl = new URL(currentUser.signatureUrl);
        const oldFilename = oldSignatureUrl.pathname.split('/').pop();
        if (oldFilename) {
          await fetch(`/api/blob/delete?filename=${encodeURIComponent(oldFilename)}`, {
            method: 'DELETE',
          });
        }
      } catch (error) {
        // Continue even if deletion fails
      }
    }

    revalidatePath('/dashboard/profile');
    return { success: true, url: blob.url };
  } catch (error) {
    return { success: false, message: 'Failed to upload signature.' };
  }
}
