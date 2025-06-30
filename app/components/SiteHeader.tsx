'use client'

import { Stack, Typography, IconButton } from '@mui/material'
import { ChevronLeft } from '@mui/icons-material'
import { useRouter } from 'next/navigation'

type SiteHeaderProps = {
  title?: string
  showOverline?: boolean
  overline?: string
}
export default function FabMenu({ title, overline, showOverline }: SiteHeaderProps){

    const router = useRouter()

    return (
        <Stack direction="column" spacing={0} sx={{ mb: 4, alignItems: 'flex-start' }}>
            {showOverline && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{marginLeft: -2}}>
                    <IconButton 
                        onClick={() => router.back()}
                        aria-labelledby='back-label'>
                        <ChevronLeft fontSize='large'/>
                    </IconButton>
                    <Typography variant="overline" component="p" gutterBottom id='back-label'>
                        {overline}
                    </Typography>
                </Stack>
            )}

            <Typography variant="h4" component="h1" gutterBottom>
                {title}
            </Typography>
        </Stack>
    )
}